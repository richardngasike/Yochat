import { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, MessageCircle, Star } from 'lucide-react';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';
import styles from './ContactsPanel.module.css';

export default function ContactsPanel({ onStartChat }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/users/contacts').then(r => setContacts(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter(c =>
    c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleAdd = async () => {
    if (!addPhone.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/users/contacts', { phone: addPhone, nickname: addNickname });
      toast.success('Contact added!');
      setContacts(prev => [...prev, res.data.contact]);
      setShowAdd(false);
      setAddPhone('');
      setAddNickname('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add contact');
    } finally {
      setAdding(false);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const res = await api.post('/conversations/direct', { user_id: userId });
      const convs = await api.get('/conversations');
      const conv = convs.data.find(c => c.id === res.data.id);
      if (conv) onStartChat(conv);
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Contacts</h2>
        <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)} title="Add contact">
          <UserPlus size={18} />
        </button>
      </div>

      {showAdd && (
        <div className={styles.addForm}>
          <input
            placeholder="Phone number (with country code)"
            value={addPhone}
            onChange={e => setAddPhone(e.target.value)}
            className={styles.addInput}
          />
          <input
            placeholder="Nickname (optional)"
            value={addNickname}
            onChange={e => setAddNickname(e.target.value)}
            className={styles.addInput}
          />
          <button className={styles.addSubmit} onClick={handleAdd} disabled={adding || !addPhone.trim()}>
            {adding ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      )}

      <div className={styles.searchBar}>
        <Search size={15} className={styles.searchIcon} />
        <input
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {search ? 'No contacts found' : 'No contacts yet. Add some!'}
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className={styles.item}>
              <Avatar src={c.avatar_url} name={c.display_name} size={44} status={c.status} />
              <div className={styles.info}>
                <span className={styles.name}>{c.nickname || c.display_name}</span>
                <span className={styles.phone}>{c.phone}</span>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleStartChat(c.user_id || c.id)}
                  title="Message"
                >
                  <MessageCircle size={17} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
