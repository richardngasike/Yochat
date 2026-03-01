import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export const formatMessageTime = (date) => {
  const d = dayjs(date);
  if (d.isToday()) return d.format('h:mm A');
  if (d.isYesterday()) return 'Yesterday';
  if (dayjs().diff(d, 'day') < 7) return d.format('ddd');
  return d.format('MM/DD/YY');
};

export const formatLastSeen = (date, status) => {
  if (status === 'online') return 'Online';
  if (!date) return 'Last seen recently';
  const d = dayjs(date);
  if (d.isToday()) return `Last seen today at ${d.format('h:mm A')}`;
  if (d.isYesterday()) return `Last seen yesterday at ${d.format('h:mm A')}`;
  return `Last seen ${d.format('MMM D')} at ${d.format('h:mm A')}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatStoryTime = (date) => {
  return dayjs(date).fromNow();
};

export const formatCallDuration = (start, end) => {
  if (!end) return '-';
  const secs = Math.floor((new Date(end) - new Date(start)) / 1000);
  return formatDuration(secs);
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getFileIcon = (type, name) => {
  if (!type && !name) return 'file';
  const ext = name ? name.split('.').pop().toLowerCase() : '';
  if (type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (type?.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (type?.startsWith('audio/') || ['mp3', 'ogg', 'wav'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
  return 'file';
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

export const generateGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];
  if (!name) return gradients[0];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
};
