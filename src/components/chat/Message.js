import { useState, useRef, useEffect } from 'react';
import {
  CornerUpLeft, Edit2, Trash2, Smile, Copy, Pin,
  MoreHorizontal, CheckCheck, Check, Download, FileText,
  Share2, Star, Info, EyeOff, Forward, Clock
} from 'lucide-react';
import api from '../../utils/api';
import { formatMessageTime, formatFileSize } from '../../utils/format';
import { getMediaUrl } from '../../utils/api';
import Avatar from '../common/Avatar';
import styles from './Message.module.css';

// Extended GB-style reactions
const REACTIONS = ['👍','❤️','😂','😮','😢','🙏','🔥','😍','💯','🎉','😅','👏'];

export default function Message({ message: msg, isOwn, onReply, onDelete, onForward, conversationId, currentUserId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content || '');
  const [isStarred, setIsStarred] = useState(msg.is_starred || false);
  const [showInfo, setShowInfo] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleReact = async (emoji) => {
    setShowReactions(false);
    try { await api.post(`/messages/${msg.id}/react`, { emoji }); } catch {}
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/messages/${msg.id}`, { content: editContent });
      setIsEditing(false);
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || '');
    setShowMenu(false);
  };

  const handlePin = async () => {
    try { await api.post(`/messages/${msg.id}/pin`); } catch {}
    setShowMenu(false);
  };

  const handleStar = async () => {
    try {
      await api.post(`/messages/${msg.id}/star`);
      setIsStarred(v => !v);
    } catch {}
    setShowMenu(false);
  };

  // Read status indicator
  const renderTick = () => {
    if (!isOwn) return null;
    if (msg.is_read) {
      return <CheckCheck size={14} className={styles.tickRead} />;   // green double tick
    }
    if (msg.receipts?.some(r => r.status === 'delivered')) {
      return <CheckCheck size={14} className={styles.tickDelivered} />; // grey double tick
    }
    return <Check size={14} className={styles.tickSent} />;             // single grey tick
  };

  const renderContent = () => {
    // "Delete for everyone" leaves NO trace — already filtered out at ChatArea level
    // msg.is_deleted only shown if somehow it reaches here
    if (msg.is_deleted) return null;

    switch (msg.message_type) {
      case 'image':
        return (
          <div className={styles.mediaContent}>
            <img
              src={getMediaUrl(msg.media_url)}
              alt="Image"
              className={styles.mediaImage}
              loading="lazy"
              onClick={() => window.open(getMediaUrl(msg.media_url), '_blank')}
            />
            {msg.content && <p className={styles.caption}>{msg.content}</p>}
          </div>
        );

      case 'video':
        return (
          <div className={styles.mediaContent}>
            <video controls className={styles.mediaVideo} preload="metadata">
              <source src={getMediaUrl(msg.media_url)} />
            </video>
            {msg.content && <p className={styles.caption}>{msg.content}</p>}
          </div>
        );

      case 'audio':
        return (
          <div className={styles.audioContent}>
            <audio controls className={styles.audioPlayer}>
              <source src={getMediaUrl(msg.media_url)} />
            </audio>
          </div>
        );

      case 'document':
        return (
          <a
            href={getMediaUrl(msg.media_url)}
            download={msg.media_name}
            target="_blank"
            rel="noreferrer"
            className={styles.docContent}
          >
            <div className={styles.docIcon}><FileText size={24} /></div>
            <div className={styles.docInfo}>
              <span className={styles.docName}>{msg.media_name || 'Document'}</span>
              <span className={styles.docSize}>{formatFileSize(msg.media_size)}</span>
            </div>
            <Download size={18} className={styles.downloadIcon} />
          </a>
        );

      default:
        return (
          <p className={styles.textContent}>
            {msg.content}
            {msg.is_edited && <span className={styles.edited}> · edited</span>}
          </p>
        );
    }
  };

  const reactionEntries = msg.reactions
    ? Object.entries(msg.reactions).filter(([, users]) => users.length > 0)
    : [];

  // GB Feature: long press / swipe context
  const handleLongPress = () => setShowMenu(true);

  return (
    <div
      className={`${styles.wrapper} ${isOwn ? styles.own : styles.other} ${isStarred ? styles.starred : ''}`}
      onContextMenu={e => { e.preventDefault(); setShowMenu(true); }}
    >
      {!isOwn && (
        <Avatar src={msg.sender_avatar} name={msg.sender_name} size={28} className={styles.avatar} />
      )}

      <div className={styles.bubbleGroup}>
        {/* Forwarded indicator */}
        {msg.forwarded_from_id && (
          <div className={styles.forwarded}>
            <Forward size={12} /> Forwarded
          </div>
        )}

        {/* Reply preview */}
        {msg.reply_to_message?.id && (
          <div className={styles.replyPreview}>
            <div className={styles.replyBar} />
            <div className={styles.replyContent}>
              <span className={styles.replySender}>
                {msg.reply_to_message.sender_id === msg.sender_id ? 'You' : msg.reply_to_message.sender_name || 'Message'}
              </span>
              <span className={styles.replyText}>
                {msg.reply_to_message.content || msg.reply_to_message.message_type}
              </span>
            </div>
          </div>
        )}

        <div className={styles.bubble}>
          {/* Group chat: show sender name */}
          {!isOwn && <span className={styles.senderName}>{msg.sender_name}</span>}

          {isEditing ? (
            <div className={styles.editArea}>
              <input
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
                className={styles.editInput}
              />
              <div className={styles.editActions}>
                <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={handleEdit} className={styles.saveBtn}>Save</button>
              </div>
            </div>
          ) : renderContent()}

          {/* Reactions */}
          {reactionEntries.length > 0 && (
            <div className={styles.reactions}>
              {reactionEntries.map(([emoji, users]) => (
                <button
                  key={emoji}
                  className={`${styles.reaction} ${users.includes(currentUserId) ? styles.myReaction : ''}`}
                  onClick={() => handleReact(emoji)}
                  title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                >
                  {emoji} <span>{users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className={styles.meta}>
            {isStarred && <Star size={10} className={styles.starIcon} />}
            <span className={styles.time}>{formatMessageTime(msg.created_at)}</span>
            {renderTick()}
          </div>
        </div>

        {/* Hover action buttons */}
        <div className={`${styles.hoverActions} ${isOwn ? styles.hoverLeft : styles.hoverRight}`}>
          <button className={styles.hoverBtn} onClick={() => setShowReactions(v => !v)} title="React">
            <Smile size={15} />
          </button>
          <button className={styles.hoverBtn} onClick={() => onReply(msg)} title="Reply">
            <CornerUpLeft size={15} />
          </button>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.hoverBtn} onClick={() => setShowMenu(v => !v)}>
              <MoreHorizontal size={15} />
            </button>

            {showMenu && (
              <div className={`${styles.menu} ${isOwn ? styles.menuLeft : styles.menuRight}`}>
                <button onClick={handleCopy}><Copy size={14} /> Copy text</button>
                <button onClick={() => { onReply(msg); setShowMenu(false); }}><CornerUpLeft size={14} /> Reply</button>
                {onForward && (
                  <button onClick={() => { onForward(msg); setShowMenu(false); }}><Forward size={14} /> Forward</button>
                )}
                <button onClick={handlePin}><Pin size={14} /> Pin message</button>
                <button onClick={handleStar}><Star size={14} /> {isStarred ? 'Unstar' : 'Star'} message</button>
                <button onClick={() => { setShowInfo(true); setShowMenu(false); }}>
                  <Info size={14} /> Message info
                </button>
                {isOwn && !msg.is_deleted && (
                  <>
                    <div className={styles.menuDivider} />
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                      <Edit2 size={14} /> Edit message
                    </button>
                    <button className={styles.danger} onClick={() => { onDelete(msg.id, true); setShowMenu(false); }}>
                      <Trash2 size={14} /> Delete for everyone
                    </button>
                    <button onClick={() => { onDelete(msg.id, false); setShowMenu(false); }}>
                      <EyeOff size={14} /> Delete for me
                    </button>
                  </>
                )}
                {!isOwn && (
                  <>
                    <div className={styles.menuDivider} />
                    <button className={styles.danger} onClick={() => { onDelete(msg.id, false); setShowMenu(false); }}>
                      <Trash2 size={14} /> Remove for me
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <div className={`${styles.reactionPicker} ${isOwn ? styles.pickerLeft : styles.pickerRight}`}>
          {REACTIONS.map(emoji => (
            <button key={emoji} className={styles.emojiBtn} onClick={() => handleReact(emoji)}>
              {emoji}
            </button>
          ))}
          <button className={styles.emojiBtn} onClick={() => setShowReactions(false)}>✕</button>
        </div>
      )}

      {/* Message info modal */}
      {showInfo && (
        <div className={styles.infoOverlay} onClick={() => setShowInfo(false)}>
          <div className={styles.infoModal} onClick={e => e.stopPropagation()}>
            <h4>Message Info</h4>
            <div className={styles.infoRow}>
              <Clock size={14} /> Sent: {new Date(msg.created_at).toLocaleString()}
            </div>
            {msg.receipts?.map(r => (
              <div key={r.user_id} className={styles.infoRow}>
                {r.status === 'read'
                  ? <CheckCheck size={14} className={styles.tickRead} />
                  : <CheckCheck size={14} className={styles.tickDelivered} />
                }
                {r.status === 'read' ? 'Read' : 'Delivered'} {r.read_at ? `· ${new Date(r.read_at).toLocaleTimeString()}` : ''}
              </div>
            ))}
            <button className={styles.closeInfo} onClick={() => setShowInfo(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
