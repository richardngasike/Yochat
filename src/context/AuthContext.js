import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const initializeSocket = useCallback((token) => {
    const s = initSocket(token);
    setSocket(s);
    return s;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('wc_token');
    const savedUser = localStorage.getItem('wc_user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Verify token and get fresh user data
        api.get('/users/me').then((res) => {
          setUser(res.data);
          localStorage.setItem('wc_user', JSON.stringify(res.data));
          initializeSocket(token);
        }).catch(() => {
          localStorage.removeItem('wc_token');
          localStorage.removeItem('wc_user');
          setUser(null);
        }).finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [initializeSocket]);

  const login = useCallback((token, userData) => {
    localStorage.setItem('wc_token', token);
    localStorage.setItem('wc_user', JSON.stringify(userData));
    setUser(userData);
    initializeSocket(token);
  }, [initializeSocket]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('wc_token');
    localStorage.removeItem('wc_user');
    disconnectSocket();
    setSocket(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('wc_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, socket, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
