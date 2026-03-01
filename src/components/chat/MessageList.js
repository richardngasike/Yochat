import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Message from './Message';
import styles from './MessageList.module.css';

export default function MessageList({ messages, loading, hasMore, onLoadMore, onReply, onDelete, conversationId }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const isFirstLoad = useRef(true);

  // Scroll to bottom on first load or new message
  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      const container = containerRef.current;
      if (!container) return;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender_id === user?.id) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length, user?.id, loading]);

  // Handle scroll for loading more
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && hasMore && !loading) {
      prevScrollHeight.current = container.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Maintain scroll position when loading old messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !prevScrollHeight.current) return;
    const newScrollHeight = container.scrollHeight;
    const diff = newScrollHeight - prevScrollHeight.current;
    if (diff > 0) {
      container.scrollTop = diff;
      prevScrollHeight.current = 0;
    }
  }, [messages.length]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.dots}>
          <span /><span /><span />
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;
  messages.forEach((msg, idx) => {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ type: 'date', date: msg.created_at, id: `date-${idx}` });
    }
    groupedMessages.push({ type: 'message', data: msg });
  });

  return (
    <div className={styles.container} ref={containerRef} onScroll={handleScroll}>
      {hasMore && (
        <div className={styles.loadMore}>
          <button onClick={onLoadMore} className={styles.loadMoreBtn}>Load older messages</button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <p>No messages yet. Say hello!</p>
        </div>
      ) : (
        groupedMessages.map(item => {
          if (item.type === 'date') {
            return (
              <div key={item.id} className={styles.dateDivider}>
                <span>{formatDate(item.date)}</span>
              </div>
            );
          }
          const msg = item.data;
          return (
            <Message
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
              onReply={() => onReply(msg)}
              onDelete={(forEveryone) => onDelete(msg.id, forEveryone)}
              conversationId={conversationId}
            />
          );
        })
      )}

      <div ref={bottomRef} className={styles.bottom} />
    </div>
  );
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
