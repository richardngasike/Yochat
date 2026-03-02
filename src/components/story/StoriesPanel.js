import { useState, useEffect, useRef } from 'react';
import { Plus, Eye, Trash2, X, Image, Type, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { formatStoryTime } from '../../utils/format';
import { getMediaUrl } from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './StoriesPanel.module.css';

const BG_COLORS = ['#6C63FF','#FF6584','#43E97B','#FFB830','#00B4D8','#E91E63','#FF5722','#1a1a35'];

export default function StoriesPanel() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // { group, index }
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState('text');
  const [storyText, setStoryText] = useState('');
  const [bgColor, setBgColor] = useState('#6C63FF');
  const [posting, setPosting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showViewers, setShowViewers] = useState(null); // story id
  const [viewers, setViewers] = useState([]);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const loadStories = () => {
    setLoading(true);
    api.get('/stories').then(r => setStories(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadStories(); }, []);

  // Auto advance story after 5 seconds
  useEffect(() => {
    if (!viewing) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      nextStory();
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [viewing?.index, viewing?.group?.user_id]);

  const handleViewStory = (group) => {
    setViewing({ group, index: 0 });
    if (group.stories[0]) {
      api.post(`/stories/${group.stories[0].id}/view`).catch(() => {});
    }
  };

  const nextStory = () => {
    if (!viewing) return;
    if (viewing.index < viewing.group.stories.length - 1) {
      const next = viewing.index + 1;
      setViewing(v => ({ ...v, index: next }));
      api.post(`/stories/${viewing.group.stories[next].id}/view`).catch(() => {});
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (!viewing || viewing.index === 0) return;
    setViewing(v => ({ ...v, index: v.index - 1 }));
  };

  const handleDeleteStory = async (storyId) => {
    await api.delete(`/stories/${storyId}`).catch(() => {});
    setViewing(null);
    loadStories();
    toast.success('Story deleted');
  };

  const handleLoadViewers = async (storyId) => {
    setShowViewers(storyId);
    try {
      const res = await api.get(`/stories/${storyId}/views`);
      setViewers(res.data);
    } catch { setViewers([]); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCreateType(file.type.startsWith('image/') ? 'image' : 'video');
  };

  const handlePostStory = async () => {
    if (createType === 'text' && !storyText.trim()) {
      toast.error('Please write something');
      return;
    }
    if ((createType === 'image' || createType === 'video') && !previewFile) {
      toast.error('Please select a file');
      return;
    }

    setPosting(true);
    try {
      if (createType === 'text') {
        await api.post('/stories', {
          content: storyText,
          story_type: 'text',
          background_color: bgColor,
          privacy: 'contacts',
        });
      } else {
        const formData = new FormData();
        formData.append('media', previewFile);
        formData.append('story_type', createType);
        formData.append('privacy', 'contacts');
        if (storyText) formData.append('content', storyText);
        await api.post('/stories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Story posted!');
      setShowCreate(false);
      setStoryText('');
      setPreviewFile(null);
      setPreviewUrl(null);
      setCreateType('text');
      loadStories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post story');
    } finally {
      setPosting(false);
    }
  };

  const myGroup = stories.find(g => g.user_id === user?.id);
  const currentStory = viewing?.group?.stories?.[viewing?.index];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Stories</h2>
      </div>

      {/* My story */}
      <div className={styles.myStory}>
        <div className={styles.myAvatarWrap}>
          <Avatar src={user?.avatar_url} name={user?.display_name} size={52} />
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
            <Plus size={14} />
          </button>
        </div>
        <div className={styles.myInfo}>
          <span className={styles.myName}>My Story</span>
          <span className={styles.myCount}>
            {myGroup ? `${myGroup.stories.length} update${myGroup.stories.length !== 1 ? 's' : ''}` : 'Add to your story'}
          </span>
        </div>
        {myGroup && (
          <button className={styles.viewBtn} onClick={() => handleViewStory(myGroup)}>View</button>
        )}
      </div>

      <div className={styles.divider} />

      {/* Others stories */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Loading stories...</div>
        ) : stories.filter(g => g.user_id !== user?.id).length === 0 ? (
          <div className={styles.empty}>No stories from contacts yet</div>
        ) : (
          stories.filter(g => g.user_id !== user?.id).map(group => (
            <button
              key={group.user_id}
              className={styles.storyItem}
              onClick={() => handleViewStory(group)}
            >
              <div className={`${styles.storyRing} ${group.has_unseen ? styles.unseenRing : styles.seenRing}`}>
                <Avatar src={group.avatar_url} name={group.display_name} size={48} />
              </div>
              <div className={styles.storyInfo}>
                <span className={styles.storyName}>{group.display_name}</span>
                <span className={styles.storyTime}>{formatStoryTime(group.stories[0]?.created_at)}</span>
              </div>
              {group.has_unseen && <div className={styles.unseenDot} />}
            </button>
          ))
        )}
      </div>

      {/* ── Create story modal ── */}
      {showCreate && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className={styles.createModal}>
            <div className={styles.createHeader}>
              <h3>New Story</h3>
              <button onClick={() => { setShowCreate(false); setPreviewFile(null); setPreviewUrl(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.createTabs}>
              <button
                className={`${styles.tab} ${createType === 'text' ? styles.activeTab : ''}`}
                onClick={() => setCreateType('text')}
              >
                <Type size={15} /> Text
              </button>
              <button
                className={`${styles.tab} ${createType === 'image' || createType === 'video' ? styles.activeTab : ''}`}
                onClick={() => document.getElementById('storyFileInput').click()}
              >
                <Image size={15} /> Photo/Video
              </button>
              <input
                id="storyFileInput"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {/* Text story editor */}
            {createType === 'text' && (
              <>
                <div className={styles.textEditor} style={{ background: bgColor }}>
                  <textarea
                    className={styles.storyTextarea}
                    placeholder="What's on your mind?"
                    value={storyText}
                    onChange={e => setStoryText(e.target.value)}
                    maxLength={500}
                    autoFocus
                  />
                </div>
                <div className={styles.colorRow}>
                  {BG_COLORS.map(c => (
                    <button
                      key={c}
                      className={`${styles.colorDot} ${bgColor === c ? styles.activeDot : ''}`}
                      style={{ background: c }}
                      onClick={() => setBgColor(c)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Media preview */}
            {(createType === 'image' || createType === 'video') && previewUrl && (
              <div className={styles.mediaPreview}>
                {createType === 'image'
                  ? <img src={previewUrl} alt="Preview" className={styles.previewImg} />
                  : <video src={previewUrl} controls className={styles.previewVideo} />
                }
                <input
                  className={styles.captionInput}
                  placeholder="Add a caption (optional)"
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                />
                <button className={styles.changeFile} onClick={() => document.getElementById('storyFileInput').click()}>
                  Change file
                </button>
              </div>
            )}

            {/* No file selected yet for media */}
            {(createType === 'image' || createType === 'video') && !previewUrl && (
              <div className={styles.uploadZone} onClick={() => document.getElementById('storyFileInput').click()}>
                <Image size={32} />
                <span>Click to select photo or video</span>
              </div>
            )}

            <button
              className={styles.postBtn}
              onClick={handlePostStory}
              disabled={posting || (createType === 'text' && !storyText.trim()) || ((createType === 'image' || createType === 'video') && !previewFile)}
            >
              {posting ? 'Posting...' : '✦ Post Story'}
            </button>
          </div>
        </div>
      )}

      {/* ── Story viewer ── */}
      {viewing && currentStory && (
        <div className={styles.viewer}>
          {/* Progress bars */}
          <div className={styles.progressBars}>
            {viewing.group.stories.map((_, i) => (
              <div key={i} className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: i < viewing.index ? '100%' : i === viewing.index ? '0%' : '0%',
                    animation: i === viewing.index ? 'storyProgress 5s linear forwards' : 'none',
                    background: i < viewing.index ? 'white' : 'white',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Viewer header */}
          <div className={styles.viewerHeader}>
            <Avatar src={viewing.group.avatar_url} name={viewing.group.display_name} size={36} />
            <div className={styles.viewerMeta}>
              <span className={styles.viewerName}>{viewing.group.display_name}</span>
              <span className={styles.viewerTime}>{formatStoryTime(currentStory.created_at)}</span>
            </div>
            <div className={styles.viewerActions}>
              {viewing.group.user_id === user?.id && (
                <>
                  <button
                    className={styles.viewersBtn}
                    onClick={() => handleLoadViewers(currentStory.id)}
                    title="Who viewed"
                  >
                    <Eye size={18} />
                    {currentStory.view_count > 0 && <span>{currentStory.view_count}</span>}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteStory(currentStory.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
              <button className={styles.closeBtn} onClick={() => setViewing(null)}>
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Story content */}
          <div
            className={styles.storyDisplay}
            style={currentStory.story_type === 'text' ? { background: currentStory.background_color || '#6C63FF' } : {}}
          >
            {currentStory.story_type === 'text' && (
              <p className={styles.storyText}>{currentStory.content}</p>
            )}
            {currentStory.story_type === 'image' && (
              <img src={getMediaUrl(currentStory.media_url)} alt="Story" className={styles.storyMedia} />
            )}
            {currentStory.story_type === 'video' && (
              <video
                src={getMediaUrl(currentStory.media_url)}
                className={styles.storyMedia}
                autoPlay
                playsInline
              />
            )}
            {currentStory.content && currentStory.story_type !== 'text' && (
              <div className={styles.storyCaption}>{currentStory.content}</div>
            )}
          </div>

          {/* Nav buttons */}
          <button className={styles.prevBtn} onClick={prevStory}><ChevronLeft size={28} /></button>
          <button className={styles.nextBtn} onClick={nextStory}><ChevronRight size={28} /></button>
        </div>
      )}

      {/* ── Viewers panel ── */}
      {showViewers && (
        <div className={styles.viewersOverlay} onClick={() => setShowViewers(null)}>
          <div className={styles.viewersPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.viewersPanelHeader}>
              <h4><Eye size={16} /> Viewed by ({viewers.length})</h4>
              <button onClick={() => setShowViewers(null)}><X size={18} /></button>
            </div>
            <div className={styles.viewersList}>
              {viewers.length === 0 ? (
                <p className={styles.noViewers}>No views yet</p>
              ) : viewers.map(v => (
                <div key={v.id} className={styles.viewerItem}>
                  <Avatar src={v.avatar_url} name={v.display_name} size={36} />
                  <div className={styles.viewerInfo}>
                    <span className={styles.viewerItemName}>{v.display_name}</span>
                    <span className={styles.viewerItemTime}>{formatStoryTime(v.viewed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
