import { useState } from 'react';
import { getInitials, generateGradient } from '../../utils/format';
import { getMediaUrl } from '../../utils/api';
import styles from './Avatar.module.css';

export default function Avatar({ src, name, size = 40, status, onClick, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const gradient = generateGradient(name);
  const initials = getInitials(name);
  const mediaUrl = getMediaUrl(src);

  return (
    <div
      className={`${styles.avatar} ${onClick ? styles.clickable : ''} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
      onClick={onClick}
    >
      {mediaUrl && !imgError ? (
        <img
          src={mediaUrl}
          alt={name || 'User'}
          onError={() => setImgError(true)}
          className={styles.image}
        />
      ) : (
        <div className={styles.fallback} style={{ background: gradient }}>
          <span style={{ fontSize: size * 0.36 }}>{initials}</span>
        </div>
      )}
      {status && (
        <span
          className={styles.status}
          data-status={status}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
