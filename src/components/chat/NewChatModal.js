import { useState } from 'react';
import { Search, X, Users, UserPlus } from 'lucide-react';
import api from '../../utils/api';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import styles from './NewChatModal.module.css';

export default function NewChatModal({ onClose, onSelectConversation }) {
  const { addConversation } = useChat();
  const [tab, setTab] = useState('direct');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q || q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      setResults(res.data);
    } catch {} finally {
      setSearching(false);
    }
  };

  const handleStartDirect = async (userId) => {
    setCreating(true);
    try {
      const res = await api.post('/conversations/direct', { user_id: userId });
      const convRes = await api.get('/conversations');
      const conv = convRes.data.find(c => c.id === res.data.id);
      if (conv) { addConversation(conv); onSelectConversation(conv); }
      else onSelectConversation({ id: res.data.id });
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (user) => {
    setSelected(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) return prev.filter(u => u.id !== user.id);
      return [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post('/conversations/group', {
        name: groupName,
        participant_ids: selected.map(u => u.id),
      });
      addConversation(res.data);
      onSelectConversation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{tab === 'direct' ? 'New Chat' : 'New Group'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'direct' ? styles.activeTab : ''}`}
            onClick={() => { setTab('direct'); setSelected([]); }}
          >
            <UserPlus size={16} /> Direct
          </button>
          <button
            className={`${styles.tab} ${tab === 'group' ? styles.activeTab : ''}`}
            onClick={() => setTab('group')}
          >
            <Users size={16} /> Group
          </button>
        </div>

        {tab === 'group' && (
          <div className={styles.groupNameInput}>
            <input
              placeholder="Group name..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className={styles.nameInput}
            />
          </div>
        )}

        {tab === 'group' && selected.length > 0 && (
          <div className={styles.selectedList}>
            {selected.map(u => (
              <div key={u.id} className={styles.selectedChip}>
                <Avatar src={u.avatar_url} name={u.display_name} size={24} />
                <span>{u.display_name}</span>
                <button onClick={() => toggleSelect(u)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.results}>
          {searching && <div className={styles.searching}>Searching...</div>}
          {!searching && search.length > 1 && results.length === 0 && (
            <div className={styles.noResults}>No users found</div>
          )}
          {results.map(u => (
            <div key={u.id} className={styles.userItem}>
              <Avatar src={u.avatar_url} name={u.display_name} size={42} status={u.status} />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{u.display_name}</span>
                <span className={styles.userPhone}>{u.phone}</span>
              </div>
              {tab === 'direct' ? (
                <button
                  className={styles.startBtn}
                  onClick={() => handleStartDirect(u.id)}
                  disabled={creating}
                >
                  Chat
                </button>
              ) : (
                <button
                  className={`${styles.selectBtn} ${selected.find(s => s.id === u.id) ? styles.selectedBtn : ''}`}
                  onClick={() => toggleSelect(u)}
                >
                  {selected.find(s => s.id === u.id) ? 'Remove' : 'Add'}
                </button>
              )}
            </div>
          ))}
        </div>

        {tab === 'group' && (
          <div className={styles.footer}>
            <button
              className={styles.createBtn}
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim() || selected.length === 0}
            >
              {creating ? 'Creating...' : `Create Group (${selected.length} members)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
