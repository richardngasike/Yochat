import { useState, useRef } from 'react';
import {
  Camera, Edit2, Save, X, LogOut, Bell, Lock,
  Eye, EyeOff, Shield, HardDrive, User, ChevronRight,
  Smartphone, Globe, Moon
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    if (!form.display_name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await api.patch('/users/me', form);
      updateUser(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar_url: res.data.avatar_url });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to update avatar');
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Settings</h2>
      </div>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatarWrapper}>
          <Avatar src={user?.avatar_url} name={user?.display_name} size={72} />
          <button
            className={styles.changeAvatar}
            onClick={() => fileInputRef.current?.click()}
            title="Change photo"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <div className={styles.field}>
              <label>Display Name</label>
              <input
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                className={styles.input}
                maxLength={50}
              />
            </div>
            <div className={styles.field}>
              <label>Username</label>
              <div className={styles.usernameInput}>
                <span className={styles.at}>@</span>
                <input
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                  className={styles.input}
                  maxLength={30}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                className={styles.textarea}
                maxLength={160}
                rows={3}
                placeholder="Write something about yourself..."
              />
              <span className={styles.charCount}>{form.bio.length}/160</span>
            </div>
            <div className={styles.editActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditing(false);
                  setForm({ display_name: user?.display_name || '', username: user?.username || '', bio: user?.bio || '' });
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.profileInfo}>
            <div className={styles.profileNameRow}>
              <h3>{user?.display_name}</h3>
              <button className={styles.editBtn} onClick={() => setEditing(true)}>
                <Edit2 size={16} />
              </button>
            </div>
            {user?.username && (
              <span className={styles.username}>@{user.username}</span>
            )}
            <span className={styles.phone}>{user?.phone}</span>
            {user?.bio && <p className={styles.bio}>{user.bio}</p>}
          </div>
        )}
      </div>

      {/* Settings sections */}
      <div className={styles.sections}>
        {[
          { id: 'privacy', icon: Lock, label: 'Privacy', desc: 'Control who sees your info' },
          { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Manage alerts & sounds' },
          { id: 'storage', icon: HardDrive, label: 'Storage', desc: 'Media & data usage' },
          { id: 'security', icon: Shield, label: 'Security', desc: 'Two-factor & sessions' },
          { id: 'account', icon: User, label: 'Account', desc: 'Phone, username & more' },
          { id: 'appearance', icon: Moon, label: 'Appearance', desc: 'Theme & display' },
        ].map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            className={`${styles.settingRow} ${activeSection === id ? styles.activeRow : ''}`}
            onClick={() => setActiveSection(activeSection === id ? null : id)}
          >
            <div className={styles.settingIcon}><Icon size={18} /></div>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>{label}</span>
              <span className={styles.settingDesc}>{desc}</span>
            </div>
            <ChevronRight size={16} className={`${styles.chevron} ${activeSection === id ? styles.rotated : ''}`} />
          </button>
        ))}
      </div>

      {/* App info */}
      <div className={styles.appInfo}>
        <div className={styles.YoChatBrand}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M8 30 Q12 20 16 28 Q20 36 24 18 Q28 0 32 20 Q36 38 40 22"
                  stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <circle cx="40" cy="22" r="3" fill="var(--primary)"/>
          </svg>
          <span>YoChat v1.0.0</span>
        </div>
        <p>Your conversations are end-to-end encrypted</p>
      </div>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
}
