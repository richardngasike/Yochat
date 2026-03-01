import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Phone, Video, Search, MoreVertical,
  Info, Archive, Bell, BellOff, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { formatLastSeen } from '../../utils/format';
import styles from './ChatArea.module.css';

export default function ChatArea({ onBack }) {
  const { user, socket } = useAuth();
  const { activeConversation, onlineUsers, getTypingText, updateConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const conv = activeConversation;
  const otherUser = conv?.other_user;
  const convName = conv?.type === 'direct' ? otherUser?.display_name : conv?.name;
  const convAvatar = conv?.type === 'direct' ? otherUser?.avatar_url : conv?.avatar_url;
  const onlineStatus = conv?.type === 'direct'
    ? onlineUsers[otherUser?.id]?.status || otherUser?.status
    : null;
  const lastSeen = conv?.type === 'direct'
    ? onlineUsers[otherUser?.id]?.last_seen || otherUser?.last_seen
    : null;

  const typingText = getTypingText(conv?.id);

  const loadMessages = useCallback(async (before = null) => {
    if (!conv?.id) return;
    try {
      const params = { limit: 50 };
      if (before) params.before = before;
      const res = await api.get(`/messages/${conv.id}`, { params });
      const newMsgs = res.data;
      if (before) {
        setMessages(prev => [...newMsgs, ...prev]);
      } else {
        setMessages(newMsgs);
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
    setLoading(true);
    setMessages([]);
    loadMessages();

    // Mark as read
    api.post(`/conversations/${conv.id}/read`).catch(() => {});
    updateConversation({ id: conv.id, unread_count: 0 });

    // Join socket room
    socket?.emit('join_conversation', conv.id);

    return () => {
      socket?.emit('leave_conversation', conv.id);
    };
  }, [conv?.id, loadMessages, socket, updateConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation_id !== conv?.id) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark as read immediately
      api.post(`/conversations/${conv.id}/read`).catch(() => {});
      socket.emit('message_read', { message_id: msg.id, conversation_id: conv.id });
    };

    const handleMessageEdited = (msg) => {
      if (msg.conversation_id !== conv?.id) return;
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
    };

    const handleMessageDeleted = ({ id }) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handleReaction = ({ message_id, reactions }) => {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, reactions } : m));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction', handleReaction);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction', handleReaction);
    };
  }, [socket, conv?.id]);

  const handleSendMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleDeleteMessage = useCallback(async (msgId, forEveryone) => {
    try {
      await api.delete(`/messages/${msgId}`, { data: { for_everyone: forEveryone } });
      if (forEveryone) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || messages.length === 0) return;
    loadMessages(messages[0]?.id);
  }, [hasMore, messages, loadMessages]);

  const statusText = typingText || (otherUser ? formatLastSeen(lastSeen, onlineStatus) : `${conv?.participants?.length || 0} members`);

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
          onClick={() => setShowInfo(!showInfo)}
        />

        <div className={styles.headerInfo} onClick={() => setShowInfo(!showInfo)}>
          <h3 className={styles.headerName}>{convName}</h3>
          <p className={`${styles.headerStatus} ${typingText ? styles.typing : ''}`}>
            {statusText}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.headerBtn} title="Search">
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
                <button onClick={() => { setShowInfo(true); setShowMenu(false); }}>
                  <Info size={16} /> View info
                </button>
                <button onClick={async () => {
                  await api.patch(`/conversations/${conv.id}/archive`, { archive: true });
                  setShowMenu(false);
                }}>
                  <Archive size={16} /> Archive
                </button>
                <button onClick={() => setShowMenu(false)}>
                  <BellOff size={16} /> Mute
                </button>
                <button className={styles.danger}>
                  <Trash2 size={16} /> Clear chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
