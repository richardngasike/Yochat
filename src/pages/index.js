import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ChatLayout from '../components/chat/ChatLayout';
import styles from './index.module.css';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [showLoader, setShowLoader] = useState(true);

  // Force loader to show for minimum 2 seconds
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 99000); 

      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  if (loading || showLoader) return <LoadingScreen />;
  if (!user) return <LoadingScreen message="Redirecting..." />;

  return (
    <div className={styles.app}>
      <ChatLayout />
    </div>
  );
}