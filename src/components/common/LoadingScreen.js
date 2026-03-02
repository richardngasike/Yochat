import Image from 'next/image';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ message = 'Loading yochat...' }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image
              src="/YoChat-Logo.png"
              alt="YoChat Logo"
              width={70}
              height={70}
              priority
            />
          </div>
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