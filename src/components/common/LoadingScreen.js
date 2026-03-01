import Image from 'next/image';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ message = 'Loading yochat...' }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image
              src="/LogoBlack.png"
              alt="YoChat Logo"
              width={48}
              height={48}
              priority
            />
          </div>
          <span className={styles.logoText}>YoChat</span>
        </div>

        <div className={styles.waveLoader}>
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={styles.waveBit}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>

        <p className={styles.message}>{message}</p>
      </div>

      <div className={styles.footer}>
        <p>End-to-end encrypted • Private & Secure</p>
      </div>
    </div>
  );
}