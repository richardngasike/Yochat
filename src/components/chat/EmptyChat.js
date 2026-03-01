import styles from './EmptyChat.module.css';

export default function EmptyChat() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#43E97B" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <path d="M8 30 Q12 20 16 28 Q20 36 24 18 Q28 0 32 20 Q36 38 40 22"
                  stroke="url(#emptyGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="40" cy="22" r="2" fill="rgba(108,99,255,0.4)"/>
          </svg>
        </div>
        <h2>Welcome to yochat</h2>
        <p>Select a conversation to start messaging,<br />or create a new chat.</p>
        <div className={styles.tips}>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>💬</span>
            <span>Real-time encrypted messaging</span>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📸</span>
            <span>Share photos, videos & documents</span>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📖</span>
            <span>Post stories that disappear in 24h</span>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📞</span>
            <span>Voice & video calls</span>
          </div>
        </div>
      </div>
    </div>
  );
}
