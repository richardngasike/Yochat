import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Paperclip, Mic, Image, X, FileText, Video,
  Music, Smile, MicOff, StopCircle
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/format';
import styles from './MessageInput.module.css';

export default function MessageInput({ conversationId, replyTo, onClearReply, onSendMessage }) {
  const { socket } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const attachRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    socket.emit('typing_start', { conversation_id: conversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', { conversation_id: conversationId });
    }, 2000);
  }, [socket, conversationId]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !conversationId || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    socket?.emit('typing_stop', { conversation_id: conversationId });
    clearTimeout(typingTimeout.current);

    try {
      const res = await api.post('/messages', {
        conversation_id: conversationId,
        content,
        message_type: 'text',
        reply_to_id: replyTo?.id,
      });
      onSendMessage(res.data);
      if (replyTo) onClearReply();
    } catch (err) {
      console.error('Send error:', err);
      setText(content);
    } finally {
      setSending(false);
    }
  }, [text, conversationId, sending, socket, replyTo, onSendMessage, onClearReply]);

  const handleFileUpload = useCallback(async (file, type) => {
    if (!file || !conversationId) return;
    setShowAttach(false);
    setSending(true);

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('conversation_id', conversationId);
      formData.append('message_type', type);
      if (replyTo) formData.append('reply_to_id', replyTo.id);

      const res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSendMessage(res.data);
      if (replyTo) onClearReply();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setSending(false);
    }
  }, [conversationId, replyTo, onSendMessage, onClearReply]);

  const handleFileSelect = (accept, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file, type);
    };
    input.click();
    setShowAttach(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await handleFileUpload(file, 'audio');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch {
      console.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
    setRecording(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '😍', '😎', '🎉', '✅', '😅', '🤔'];

  return (
    <div className={styles.container}>
      {replyTo && (
        <div className={styles.replyBanner}>
          <div className={styles.replyBar} />
          <div className={styles.replyInfo}>
            <span className={styles.replyLabel}>Replying to</span>
            <span className={styles.replyText}>
              {replyTo.content || replyTo.message_type || 'Message'}
            </span>
          </div>
          <button className={styles.clearReply} onClick={onClearReply}>
            <X size={16} />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className={styles.emojiPanel}>
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              className={styles.emojiQuick}
              onClick={() => { setText(t => t + e); setShowEmoji(false); textareaRef.current?.focus(); }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <button
          className={styles.iconBtn}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
        >
          <Smile size={22} />
        </button>

        <div className={styles.attachWrapper} ref={attachRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowAttach(!showAttach)}
            title="Attach"
          >
            <Paperclip size={22} />
          </button>
          {showAttach && (
            <div className={styles.attachMenu}>
              <button onClick={() => handleFileSelect('image/*', 'image')}>
                <Image size={18} style={{ color: '#f59e0b' }} /> Photo
              </button>
              <button onClick={() => handleFileSelect('video/*', 'video')}>
                <Video size={18} style={{ color: '#8b5cf6' }} /> Video
              </button>
              <button onClick={() => handleFileSelect('audio/*', 'audio')}>
                <Music size={18} style={{ color: '#06b6d4' }} /> Audio
              </button>
              <button onClick={() => handleFileSelect('.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip', 'document')}>
                <FileText size={18} style={{ color: '#10b981' }} /> Document
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={recording ? 'Recording...' : 'Type a message...'}
          value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={recording || sending}
        />

        {text.trim() ? (
          <button
            className={`${styles.sendBtn} ${sending ? styles.sending : ''}`}
            onClick={handleSend}
            disabled={sending}
            title="Send"
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            className={`${styles.iconBtn} ${recording ? styles.recording : ''}`}
            onClick={recording ? stopRecording : startRecording}
            title={recording ? 'Stop recording' : 'Voice message'}
          >
            {recording ? <StopCircle size={22} /> : <Mic size={22} />}
          </button>
        )}
      </div>
    </div>
  );
}
