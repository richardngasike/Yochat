import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ChatContext = createContext(null);

// Persist conversations to localStorage so chats survive page refresh/close
const STORAGE_KEY = 'wc_conversations';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveToStorage = (convs) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)); } catch {}
};

export const ChatProvider = ({ children }) => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversationsState] = useState(() => loadFromStorage());
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [sidebarView, setSidebarView] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Wrap setConversations so every change is persisted
  const setConversations = useCallback((updater) => {
    setConversationsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateConversation = useCallback((updatedConv) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c);
      // Also keep activeConversation in sync
      return next;
    });
    // Keep activeConversation in sync
    setActiveConversation(prev =>
      prev?.id === updatedConv.id ? { ...prev, ...updatedConv } : prev
    );
  }, [setConversations]);

  const addConversation = useCallback((conv) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      if (exists) return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
      return [conv, ...prev];
    });
  }, [setConversations]);

  const removeConversation = useCallback((convId) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    setActiveConversation(prev => prev?.id === convId ? null : prev);
  }, [setConversations]);

  const setUserOnlineStatus = useCallback((userId, status, lastSeen) => {
    setOnlineUsers(prev => ({ ...prev, [userId]: { status, last_seen: lastSeen } }));
  }, []);

  const setUserTyping = useCallback((conversationId, userId, displayName, isTyping) => {
    setTypingUsers(prev => {
      const convTyping = { ...(prev[conversationId] || {}) };
      if (isTyping) convTyping[userId] = displayName;
      else delete convTyping[userId];
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

  // Recalculate unread count whenever conversations change
  useEffect(() => {
    const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    setUnreadCount(total);
  }, [conversations]);

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
