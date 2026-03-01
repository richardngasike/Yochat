import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <Component {...pageProps} />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #2d2d4e',
            },
          }}
        />
      </ChatProvider>
    </AuthProvider>
  );
}
