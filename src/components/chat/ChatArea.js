import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Phone, Video, Search, MoreVertical,
  Info, Archive, Bell, BellOff, Trash2, X, Pin,
  UserMinus, Shield, Clock, EyeOff, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { formatLastSeen } from '../../utils/format';
import styles from './ChatArea.module.css';

// Per-conversation message cache so switching tabs doesn't lose messages
const msgCache = {};

export default function ChatArea({ onBack }) {
  const { user, socket } = useAuth();
  const { activeConversation, onlineUsers, getTypingText, updateConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const menuRef = useRef(null);
  const convIdRef = useRef(null);

  const conv = activeConversation;
  const otherUser = conv?.other_user;
  const convName = conv?.type === 'direct' ? otherUser?.display_name : conv?.name;
  const convAvatar = conv?.type === 'direct' ? otherUser?.avatar_url : conv?.avatar_url;
  const onlineStatus = conv?.type === 'direct'
    ? onlineUsers[otherUser?.id]?.status || otherUser?.status : null;
  const lastSeen = conv?.type === 'direct'
    ? onlineUsers[otherUser?.id]?.last_seen || otherUser?.last_seen : null;
  const typingText = getTypingText(conv?.id);

  // ── Load messages — with cache so switching convos doesn't lose history ──
  const loadMessages = useCallback(async (before = null) => {
    if (!conv?.id) return;
    try {
      const params = { limit: 50 };
      if (before) params.before = before;
      const res = await api.get(`/messages/${conv.id}`, { params });
      const newMsgs = res.data;
      if (before) {
        setMessages(prev => {
          const merged = [...newMsgs, ...prev];
          msgCache[conv.id] = merged;
          return merged;
        });
      } else {
        setMessages(newMsgs);
        msgCache[conv.id] = newMsgs;
      }
      setHasMore(newMsgs.length === 50);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conv?.id]);

  useEffect(() => {
    if (!conv?.id) return;
    convIdRef.current = conv.id;

    // Load from cache instantly, then refresh from server
    if (msgCache[conv.id]) {
      setMessages(msgCache[conv.id]);
      setLoading(false);
    } else {
      setLoading(true);
      setMessages([]);
    }

    loadMessages();
    api.post(`/conversations/${conv.id}/read`).catch(() => {});
    updateConversation({ id: conv.id, unread_count: 0 });
    socket?.emit('join_conversation', conv.id);

    return () => {
      socket?.emit('leave_conversation', conv.id);
    };
  }, [conv?.id]);

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation_id !== convIdRef.current) return;
      setMessages(prev => {
        // Deduplicate — prevent doubling
        if (prev.find(m => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        msgCache[convIdRef.current] = next;
        return next;
      });
      api.post(`/conversations/${msg.conversation_id}/read`).catch(() => {});
      socket.emit('message_read', { message_id: msg.id, conversation_id: msg.conversation_id });
    };

    const handleMessageEdited = (msg) => {
      setMessages(prev => {
        const next = prev.map(m => m.id === msg.id ? { ...m, ...msg } : m);
        if (convIdRef.current) msgCache[convIdRef.current] = next;
        return next;
      });
    };

    // "Delete for everyone" — completely remove, no trace
    const handleMessageDeleted = ({ id }) => {
      setMessages(prev => {
        const next = prev.filter(m => m.id !== id);
        if (convIdRef.current) msgCache[convIdRef.current] = next;
        return next;
      });
    };

    const handleReaction = ({ message_id, reactions }) => {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, reactions } : m));
    };

    // Green tick: message opened/read
    const handleMessageRead = ({ message_id, reader_id }) => {
      if (reader_id === user?.id) return;
      setMessages(prev => prev.map(m =>
        m.id === message_id ? { ...m, is_read: true } : m
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction', handleReaction);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction', handleReaction);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, user?.id]);

  const handleSendMessage = useCallback((msg) => {
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      if (convIdRef.current) msgCache[convIdRef.current] = next;
      return next;
    });
  }, []);

  // Delete for everyone — no "message deleted" trace left
  const handleDeleteMessage = useCallback(async (msgId, forEveryone) => {
    if (forEveryone) {
      // Optimistically remove immediately — no trace
      setMessages(prev => {
        const next = prev.filter(m => m.id !== msgId);
        if (convIdRef.current) msgCache[convIdRef.current] = next;
        return next;
      });
    }
    try {
      await api.delete(`/messages/${msgId}`, { data: { for_everyone: forEveryone } });
      if (!forEveryone) {
        setMessages(prev => {
          const next = prev.filter(m => m.id !== msgId);
          if (convIdRef.current) msgCache[convIdRef.current] = next;
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || messages.length === 0) return;
    loadMessages(messages[0]?.id);
  }, [hasMore, messages, loadMessages]);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim() || !conv?.id) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/messages/${conv.id}/search`, { params: { q } });
      setSearchResults(res.data);
    } catch {}
  };

  const statusText = typingText
    || (otherUser ? formatLastSeen(lastSeen, onlineStatus) : `${conv?.participants?.length || 0} members`);

  return (
    <div className={styles.area}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={22} />
          </button>
        )}

        <Avatar
          src={convAvatar}
          name={convName}
          size={40}
          status={conv?.type === 'direct' ? onlineStatus : null}
        />

        <div className={styles.headerInfo}>
          <h3 className={styles.headerName}>{convName}</h3>
          <p className={`${styles.headerStatus} ${typingText ? styles.typing : ''}`}>
            {statusText}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={() => setShowSearch(v => !v)} title="Search messages">
            <Search size={20} />
          </button>
          <button className={styles.headerBtn} title="Voice call">
            <Phone size={20} />
          </button>
          <button className={styles.headerBtn} title="Video call">
            <Video size={20} />
          </button>
          <div className={styles.menuWrapper} ref={menuRef}>
            <button className={styles.headerBtn} onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={styles.menu}>
                <button onClick={() => { setShowMenu(false); }}>
                  <Info size={16} /> View contact
                </button>
                <button onClick={() => { setShowDisappearing(true); setShowMenu(false); }}>
                  <Clock size={16} /> Disappearing messages
                </button>
                <button onClick={async () => {
                  await api.patch(`/conversations/${conv.id}/archive`, { archive: true });
                  setShowMenu(false);
                }}>
                  <Archive size={16} /> Archive chat
                </button>
                <button onClick={() => setShowMenu(false)}>
                  <BellOff size={16} /> Mute notifications
                </button>
                <button onClick={() => setShowMenu(false)}>
                  <EyeOff size={16} /> Hide chat
                </button>
                <button onClick={() => setShowMenu(false)}>
                  <Shield size={16} /> Encrypt backup
                </button>
                <button className={styles.danger} onClick={async () => {
                  if (!confirm('Clear all messages? This cannot be undone.')) return;
                  await api.delete(`/conversations/${conv.id}/messages`).catch(() => {});
                  setMessages([]);
                  if (convIdRef.current) delete msgCache[convIdRef.current];
                  setShowMenu(false);
                }}>
                  <Trash2 size={16} /> Clear chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search messages..."
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(''); setSearchResults([]); }}>
              <X size={16} />
            </button>
          )}
          {searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.map(m => (
                <div key={m.id} className={styles.searchResult}>
                  <span className={styles.searchSender}>{m.sender_name}</span>
                  <span className={styles.searchText}>{m.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onReply={setReplyTo}
        onDelete={handleDeleteMessage}
        conversationId={conv?.id}
      />

      {/* Input */}
      <MessageInput
        conversationId={conv?.id}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
