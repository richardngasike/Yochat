import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, X, Image, Type } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { formatStoryTime } from '../../utils/format';
import { getMediaUrl } from '../../utils/api';
import styles from './StoriesPanel.module.css';

export default function StoriesPanel() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // { userStories, currentIndex }
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState('text');
  const [storyText, setStoryText] = useState('');
  const [bgColor, setBgColor] = useState('#6C63FF');
  const [posting, setPosting] = useState(false);

  const BG_COLORS = ['#6C63FF', '#FF6584', '#43E97B', '#FFB830', '#00B4D8', '#E91E63', '#FF5722', '#212121'];

  const loadStories = () => {
    setLoading(true);
    api.get('/stories').then(r => setStories(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadStories(); }, []);

  const handleViewStory = (userGroup) => {
    setViewing({ userStories: userGroup.stories, currentIndex: 0, user: userGroup });
    // Mark first story as viewed
    if (userGroup.stories[0]) {
      api.post(`/stories/${userGroup.stories[0].id}/view`).catch(() => {});
    }
  };

  const nextStory = () => {
    if (!viewing) return;
    if (viewing.currentIndex < viewing.userStories.length - 1) {
      const nextIdx = viewing.currentIndex + 1;
      setViewing({ ...viewing, currentIndex: nextIdx });
      api.post(`/stories/${viewing.userStories[nextIdx].id}/view`).catch(() => {});
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (!viewing || viewing.currentIndex === 0) return;
    setViewing({ ...viewing, currentIndex: viewing.currentIndex - 1 });
  };

  const handlePostStory = async () => {
    if (!storyText.trim()) return;
    setPosting(true);
    try {
      await api.post('/stories', {
        content: storyText,
        story_type: 'text',
        background_color: bgColor,
      });
      setStoryText('');
      setShowCreate(false);
      loadStories();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleFileStory = async (file) => {
    const type = file.type.startsWith('image/') ? 'image' : 'video';
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('story_type', type);
      await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowCreate(false);
      loadStories();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await api.delete(`/stories/${storyId}`);
      setViewing(null);
      loadStories();
    } catch (err) {
      console.error(err);
    }
  };

  const myGroup = stories.find(g => g.user_id === user?.id);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Stories</h2>
      </div>

      {/* My story */}
      <div className={styles.myStory}>
        <div className={styles.myStoryAvatar}>
          <Avatar src={user?.avatar_url} name={user?.display_name} size={52} />
          <button className={styles.addStoryBtn} onClick={() => setShowCreate(true)}>
            <Plus size={14} />
          </button>
        </div>
        <div className={styles.myStoryInfo}>
          <span className={styles.myStoryName}>My Story</span>
          <span className={styles.myStoryCount}>
            {myGroup ? `${myGroup.stories.length} update${myGroup.stories.length !== 1 ? 's' : ''}` : 'Add to your story'}
          </span>
        </div>
        {myGroup && (
          <button className={styles.viewMyBtn} onClick={() => handleViewStory(myGroup)}>
            View
          </button>
        )}
      </div>

      <div className={styles.divider} />

      {/* Create story modal */}
      {showCreate && (
        <div className={styles.createOverlay} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className={styles.createModal}>
            <div className={styles.createHeader}>
              <h3>Add to Story</h3>
              <button onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>

            <div className={styles.createTabs}>
              <button
                className={`${styles.createTab} ${createType === 'text' ? styles.activeCreateTab : ''}`}
                onClick={() => setCreateType('text')}
              >
                <Type size={16} /> Text
              </button>
              <button
                className={`${styles.createTab} ${createType === 'media' ? styles.activeCreateTab : ''}`}
                onClick={() => setCreateType('media')}
              >
                <Image size={16} /> Photo/Video
              </button>
            </div>

            {createType === 'text' && (
              <div className={styles.textStoryEditor} style={{ background: bgColor }}>
                <textarea
                  placeholder="What's on your mind?"
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  className={styles.storyTextarea}
                  maxLength={500}
                />
              </div>
            )}

            {createType === 'text' && (
              <div className={styles.colorPicker}>
                {BG_COLORS.map(color => (
                  <button
                    key={color}
                    className={`${styles.colorSwatch} ${bgColor === color ? styles.activeSwatch : ''}`}
                    style={{ background: color }}
                    onClick={() => setBgColor(color)}
                  />
                ))}
              </div>
            )}

            {createType === 'media' && (
              <div className={styles.mediaUpload}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  id="storyFile"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) handleFileStory(f); }}
                />
                <label htmlFor="storyFile" className={styles.uploadLabel}>
                  <Image size={32} />
                  <span>Click to select photo or video</span>
                </label>
              </div>
            )}

            {createType === 'text' && (
              <button
                className={styles.postBtn}
                onClick={handlePostStory}
                disabled={posting || !storyText.trim()}
              >
                {posting ? 'Posting...' : 'Post Story'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Others' stories */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Loading stories...</div>
        ) : (
          stories.filter(g => g.user_id !== user?.id).map(group => (
            <button
              key={group.user_id}
              className={`${styles.storyItem} ${group.has_unseen ? styles.unseen : ''}`}
              onClick={() => handleViewStory(group)}
            >
              <div className={`${styles.storyRing} ${group.has_unseen ? styles.unseenRing : styles.seenRing}`}>
                <Avatar src={group.avatar_url} name={group.display_name} size={48} />
              </div>
              <div className={styles.storyInfo}>
                <span className={styles.storyName}>{group.display_name}</span>
                <span className={styles.storyTime}>
                  {formatStoryTime(group.stories[0]?.created_at)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Story viewer */}
      {viewing && (
        <div className={styles.viewer} onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className={styles.viewerContent}>
            {/* Progress bars */}
            <div className={styles.progress}>
              {viewing.userStories.map((_, i) => (
                <div key={i} className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: i < viewing.currentIndex ? '100%' : i === viewing.currentIndex ? '100%' : '0%',
                      animation: i === viewing.currentIndex ? 'progressStory 5s linear forwards' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className={styles.viewerHeader}>
              <Avatar src={viewing.user.avatar_url} name={viewing.user.display_name} size={36} />
              <div className={styles.viewerMeta}>
                <span>{viewing.user.display_name}</span>
                <span>{formatStoryTime(viewing.userStories[viewing.currentIndex]?.created_at)}</span>
              </div>
              <div className={styles.viewerActions}>
                {viewing.user.user_id === user?.id && (
                  <button
                    className={styles.deleteStoryBtn}
                    onClick={() => handleDeleteStory(viewing.userStories[viewing.currentIndex].id)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button className={styles.closeViewer} onClick={() => setViewing(null)}>
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Story content */}
            <div
              className={styles.storyDisplay}
              onClick={nextStory}
              style={
                viewing.userStories[viewing.currentIndex]?.story_type === 'text'
                  ? { background: viewing.userStories[viewing.currentIndex]?.background_color || '#6C63FF' }
                  : {}
              }
            >
              {viewing.userStories[viewing.currentIndex]?.story_type === 'text' ? (
                <p className={styles.storyText}>{viewing.userStories[viewing.currentIndex]?.content}</p>
              ) : viewing.userStories[viewing.currentIndex]?.story_type === 'image' ? (
                <img
                  src={getMediaUrl(viewing.userStories[viewing.currentIndex]?.media_url)}
                  alt="Story"
                  className={styles.storyMedia}
                />
              ) : (
                <video
                  src={getMediaUrl(viewing.userStories[viewing.currentIndex]?.media_url)}
                  className={styles.storyMedia}
                  autoPlay
                  muted={false}
                />
              )}
            </div>

            <button className={styles.prevBtn} onClick={prevStory}>&lt;</button>
            <button className={styles.nextBtn} onClick={nextStory}>&gt;</button>
          </div>
        </div>
      )}
    </div>
  );
}
