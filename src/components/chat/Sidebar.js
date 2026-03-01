import { useEffect, useState, useCallback } from 'react';
import {
  MessageCircle, Users, BookOpen, Phone, Settings,
  Search, Plus, Edit2, Moon, Sun, Archive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import ConversationList from './ConversationList';
import StoriesPanel from '../story/StoriesPanel';
import ContactsPanel from './ContactsPanel';
import CallsPanel from './CallsPanel';
import SettingsPanel from '../profile/SettingsPanel';
import NewChatModal from './NewChatModal';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'chats', icon: MessageCircle, label: 'Chats' },
  { id: 'stories', icon: BookOpen, label: 'Stories' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'calls', icon: Phone, label: 'Calls' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ onSelectConversation }) {
  const { user, updateUser } = useAuth();
  const { sidebarView, setSidebarView, conversations, setConversations, unreadCount } = useChat();
  const [theme, setTheme] = useState('dark');
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('wc_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : '');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('wc_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme === 'light' ? 'light' : '');
  };

  useEffect(() => {
    setLoading(true);
    api.get('/conversations').then(res => {
      setConversations(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [setConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className={styles.sidebar}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navTop}>
          <button className={styles.logo} onClick={() => setSidebarView('chats')}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M8 30 Q12 20 16 28 Q20 36 24 18 Q28 0 32 20 Q36 38 40 22"
                    stroke="#6C63FF" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="40" cy="22" r="3" fill="#6C63FF"/>
            </svg>
          </button>

          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`${styles.navItem} ${sidebarView === id ? styles.active : ''}`}
              onClick={() => setSidebarView(id)}
              title={label}
            >
              <Icon size={22} />
              {id === 'chats' && totalUnread > 0 && (
                <span className={styles.badge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.navBottom}>
          <button className={styles.navItem} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name}
            size={36}
            status={user?.status || 'online'}
            onClick={() => setSidebarView('settings')}
          />
        </div>
      </nav>

      {/* Panel */}
      <div className={styles.panel}>
        {sidebarView === 'chats' && (
          <>
            <div className={styles.panelHeader}>
              <h2>Chats</h2>
              <div className={styles.panelActions}>
                <button className={styles.actionBtn} onClick={() => setShowNewChat(true)} title="New chat">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelect={onSelectConversation}
            />
          </>
        )}

        {sidebarView === 'stories' && <StoriesPanel />}
        {sidebarView === 'contacts' && <ContactsPanel onStartChat={onSelectConversation} />}
        {sidebarView === 'calls' && <CallsPanel />}
        {sidebarView === 'settings' && <SettingsPanel />}
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelectConversation={(conv) => {
            onSelectConversation(conv);
            setShowNewChat(false);
            setSidebarView('chats');
          }}
        />
      )}
    </div>
  );
}
