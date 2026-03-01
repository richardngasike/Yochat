import { useState } from 'react';
import { Search, Archive } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { formatMessageTime, truncateText } from '../../utils/format';
import styles from './ConversationList.module.css';

export default function ConversationList({ conversations, loading, onSelect }) {
  const { activeConversation, onlineUsers } = useChat();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const name = c.type === 'direct'
      ? c.other_user?.display_name || ''
      : c.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message_content?.toLowerCase().includes(search.toLowerCase());
  });

  const getConvName = (conv) => {
    if (conv.type === 'direct') return conv.other_user?.display_name || 'Unknown';
    return conv.name || 'Group';
  };

  const getConvAvatar = (conv) => {
    if (conv.type === 'direct') return conv.other_user?.avatar_url;
    return conv.avatar_url;
  };

  const getConvStatus = (conv) => {
    if (conv.type !== 'direct') return null;
    const otherId = conv.other_user?.id;
    return onlineUsers[otherId]?.status || conv.other_user?.status || 'offline';
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.last_message_content && conv.last_message_type) {
      const types = { image: '📷 Photo', video: '🎥 Video', audio: '🎵 Audio', document: '📄 Document' };
      return types[conv.last_message_type] || 'Media';
    }
    return truncateText(conv.last_message_content || 'No messages yet', 45);
  };

  if (loading) {
    return (
      <div className={styles.list}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={`skeleton ${styles.skAvatar}`} />
            <div className={styles.skContent}>
              <div className={`skeleton ${styles.skLine}`} />
              <div className={`skeleton ${styles.skLine} ${styles.skShort}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>{search ? 'No conversations found' : 'No chats yet. Start a conversation!'}</p>
          </div>
        ) : (
          filtered.map(conv => {
            const isActive = activeConversation?.id === conv.id;
            const name = getConvName(conv);
            const status = getConvStatus(conv);
            const isMine = conv.last_message_sender_id === user?.id;

            return (
              <button
                key={conv.id}
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect(conv)}
              >
                <Avatar
                  src={getConvAvatar(conv)}
                  name={name}
                  size={48}
                  status={conv.type === 'direct' ? status : null}
                />

                <div className={styles.info}>
                  <div className={styles.top}>
                    <span className={styles.name}>{name}</span>
                    {conv.last_message_time && (
                      <span className={`${styles.time} ${conv.unread_count > 0 ? styles.unreadTime : ''}`}>
                        {formatMessageTime(conv.last_message_time)}
                      </span>
                    )}
                  </div>

                  <div className={styles.bottom}>
                    <span className={styles.preview}>
                      {isMine && <span className={styles.youLabel}>You: </span>}
                      {getLastMessagePreview(conv)}
                    </span>
                    <div className={styles.meta}>
                      {conv.is_muted && <span className={styles.muteIcon}>🔇</span>}
                      {conv.unread_count > 0 && (
                        <span className={styles.unreadBadge}>
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
