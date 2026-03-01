import { useState, useRef } from 'react';
import {
  CornerUpLeft, Edit2, Trash2, Smile, Copy, Pin,
  MoreHorizontal, CheckCheck, Check, Download, Play, FileText
} from 'lucide-react';
import api from '../../utils/api';
import { formatMessageTime, formatFileSize } from '../../utils/format';
import { getMediaUrl } from '../../utils/api';
import Avatar from '../common/Avatar';
import styles from './Message.module.css';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function Message({ message: msg, isOwn, onReply, onDelete, conversationId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content || '');
  const menuRef = useRef(null);

  const handleReact = async (emoji) => {
    setShowReactions(false);
    try {
      await api.post(`/messages/${msg.id}/react`, { emoji });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/messages/${msg.id}`, { content: editContent });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || '');
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      await api.post(`/messages/${msg.id}/pin`);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = () => {
    if (msg.is_deleted) {
      return <span className={styles.deleted}>This message was deleted</span>;
    }

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
            {msg.is_edited && <span className={styles.edited}> (edited)</span>}
          </p>
        );
    }
  };

  const reactionEntries = msg.reactions ? Object.entries(msg.reactions).filter(([, users]) => users.length > 0) : [];

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <Avatar src={msg.sender_avatar} name={msg.sender_name} size={28} className={styles.avatar} />
      )}

      <div className={styles.bubble}>
        {!isOwn && (
          <span className={styles.senderName}>{msg.sender_name}</span>
        )}

        {msg.reply_to_message?.id && (
          <div className={styles.replyPreview}>
            <div className={styles.replyBar} />
            <div className={styles.replyContent}>
              <span className={styles.replySender}>
                {msg.reply_to_message.sender_id === msg.sender_id ? 'You' : 'Message'}
              </span>
              <span className={styles.replyText}>
                {msg.reply_to_message.content || msg.reply_to_message.message_type}
              </span>
            </div>
          </div>
        )}

        {msg.forwarded_from_id && (
          <div className={styles.forwarded}>↪ Forwarded</div>
        )}

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

        {reactionEntries.length > 0 && (
          <div className={styles.reactions}>
            {reactionEntries.map(([emoji, users]) => (
              <button key={emoji} className={styles.reaction} onClick={() => handleReact(emoji)}>
                {emoji} <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.meta}>
          <span className={styles.time}>{formatMessageTime(msg.created_at)}</span>
          {isOwn && (
            <span className={styles.readStatus}>
              <CheckCheck size={14} className={styles.readIcon} />
            </span>
          )}
        </div>
      </div>

      <div className={`${styles.actions} ${isOwn ? styles.actionsLeft : styles.actionsRight}`}>
        <button
          className={styles.actionBtn}
          onClick={() => setShowReactions(!showReactions)}
          title="React"
        >
          <Smile size={16} />
        </button>
        <button className={styles.actionBtn} onClick={onReply} title="Reply">
          <CornerUpLeft size={16} />
        </button>
        <div className={styles.menuWrap} ref={menuRef}>
          <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className={`${styles.menu} ${isOwn ? styles.menuLeft : styles.menuRight}`}>
              <button onClick={handleCopy}><Copy size={14} /> Copy</button>
              <button onClick={() => { onReply(); setShowMenu(false); }}><CornerUpLeft size={14} /> Reply</button>
              <button onClick={handlePin}><Pin size={14} /> Pin</button>
              {isOwn && !msg.is_deleted && (
                <>
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }}><Edit2 size={14} /> Edit</button>
                  <button className={styles.danger} onClick={() => { onDelete(true); setShowMenu(false); }}>
                    <Trash2 size={14} /> Delete for everyone
                  </button>
                  <button onClick={() => { onDelete(false); setShowMenu(false); }}>
                    <Trash2 size={14} /> Delete for me
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showReactions && (
        <div className={`${styles.reactionPicker} ${isOwn ? styles.pickerLeft : styles.pickerRight}`}>
          {REACTIONS.map(emoji => (
            <button key={emoji} className={styles.emojiBtn} onClick={() => handleReact(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
