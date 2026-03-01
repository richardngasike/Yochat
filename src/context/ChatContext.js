import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [sidebarView, setSidebarView] = useState('chats'); // chats, contacts, stories, calls, settings
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const updateConversation = useCallback((updatedConv) => {
    setConversations(prev =>
      prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c)
    );
  }, []);

  const addConversation = useCallback((conv) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      if (exists) return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
      return [conv, ...prev];
    });
  }, []);

  const removeConversation = useCallback((convId) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
  }, []);

  const setUserOnlineStatus = useCallback((userId, status, lastSeen) => {
    setOnlineUsers(prev => ({ ...prev, [userId]: { status, last_seen: lastSeen } }));
  }, []);

  const setUserTyping = useCallback((conversationId, userId, displayName, isTyping) => {
    setTypingUsers(prev => {
      const convTyping = { ...(prev[conversationId] || {}) };
      if (isTyping) {
        convTyping[userId] = displayName;
      } else {
        delete convTyping[userId];
      }
      return { ...prev, [conversationId]: convTyping };
    });
  }, []);

  const getTypingText = useCallback((conversationId) => {
    const typing = typingUsers[conversationId];
    if (!typing) return null;
    const names = Object.values(typing);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  }, [typingUsers]);

  return (
    <ChatContext.Provider value={{
      activeConversation, setActiveConversation,
      conversations, setConversations, updateConversation, addConversation, removeConversation,
      onlineUsers, setUserOnlineStatus,
      typingUsers, setUserTyping, getTypingText,
      sidebarView, setSidebarView,
      searchQuery, setSearchQuery,
      unreadCount, setUnreadCount,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
