import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import EmptyChat from './EmptyChat';
import CallModal from './CallModal';
import styles from './ChatLayout.module.css';

export default function ChatLayout() {
  const { socket, user } = useAuth();
  const {
    activeConversation, setActiveConversation,
    conversations, setConversations,
    addConversation, updateConversation,
    setUserOnlineStatus, setUserTyping
  } = useChat();

  const [incomingCall, setIncomingCall] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      // Update conversation last message
      setConversations(prev =>
        prev.map(c => c.id === message.conversation_id ? {
          ...c,
          last_message_content: message.content,
          last_message_type: message.message_type,
          last_message_time: message.created_at,
          last_message_sender_id: message.sender_id,
          last_activity: message.created_at,
          unread_count: message.sender_id !== user.id && c.id !== activeConversation?.id
            ? (c.unread_count || 0) + 1
            : c.unread_count,
        } : c).sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity))
      );
    });

    socket.on('user_status', ({ user_id, status, last_seen }) => {
      setUserOnlineStatus(user_id, status, last_seen);
    });

    socket.on('user_typing', ({ user_id, display_name, conversation_id }) => {
      setUserTyping(conversation_id, user_id, display_name, true);
    });

    socket.on('user_stop_typing', ({ user_id, conversation_id }) => {
      setUserTyping(conversation_id, user_id, null, false);
    });

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('call_rejected', () => setIncomingCall(null));
    socket.on('call_ended', () => setIncomingCall(null));

    return () => {
      socket.off('new_message');
      socket.off('user_status');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('incoming_call');
      socket.off('call_rejected');
      socket.off('call_ended');
    };
  }, [socket, user, activeConversation, setConversations, setUserOnlineStatus, setUserTyping]);

  const handleSelectConversation = useCallback((conv) => {
    setActiveConversation(conv);
    if (isMobile) setShowChat(true);
  }, [setActiveConversation, isMobile]);

  const handleBack = useCallback(() => {
    setShowChat(false);
    setActiveConversation(null);
  }, [setActiveConversation]);

  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebar} ${isMobile && showChat ? styles.hideMobile : ''}`}>
        <Sidebar onSelectConversation={handleSelectConversation} />
      </div>

      <div className={`${styles.main} ${isMobile && !showChat ? styles.hideMobile : ''}`}>
        {activeConversation ? (
          <ChatArea onBack={isMobile ? handleBack : undefined} />
        ) : (
          !isMobile && <EmptyChat />
        )}
      </div>

      {incomingCall && (
        <CallModal
          call={incomingCall}
          onAccept={() => {
            // Handle accept
            setIncomingCall(null);
          }}
          onReject={() => {
            socket?.emit('call_reject', { to: incomingCall.caller_id, call_id: incomingCall.call_id });
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
