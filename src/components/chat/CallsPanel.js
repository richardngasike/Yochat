import { useEffect, useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { formatCallDuration, formatMessageTime } from '../../utils/format';
import styles from './CallsPanel.module.css';

export default function CallsPanel() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/calls/history').then(r => setCalls(r.data)).finally(() => setLoading(false));
  }, []);

  const getCallIcon = (call) => {
    if (call.status === 'missed') return <PhoneMissed size={16} className={styles.missed} />;
    if (call.caller_id === user?.id) return <PhoneOutgoing size={16} className={styles.outgoing} />;
    return <PhoneIncoming size={16} className={styles.incoming} />;
  };

  const getOtherUser = (call) => {
    if (call.caller_id === user?.id) {
      return { name: call.callee_name, avatar: call.callee_avatar };
    }
    return { name: call.caller_name, avatar: call.caller_avatar };
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Calls</h2>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Loading calls...</div>
        ) : calls.length === 0 ? (
          <div className={styles.empty}>
            <Phone size={32} className={styles.emptyIcon} />
            <p>No recent calls</p>
          </div>
        ) : (
          calls.map(call => {
            const other = getOtherUser(call);
            return (
              <div key={call.id} className={styles.item}>
                <Avatar src={other.avatar} name={other.name} size={44} />
                <div className={styles.info}>
                  <span className={styles.name}>{other.name}</span>
                  <div className={styles.meta}>
                    {getCallIcon(call)}
                    <span className={`${styles.status} ${call.status === 'missed' ? styles.missedText : ''}`}>
                      {call.status === 'missed' ? 'Missed' :
                       call.status === 'ended' ? formatCallDuration(call.started_at, call.ended_at) :
                       call.status}
                    </span>
                  </div>
                </div>
                <div className={styles.right}>
                  <span className={styles.time}>{formatMessageTime(call.started_at)}</span>
                  <div className={styles.type}>
                    {call.call_type === 'video' ? <Video size={14} /> : <Phone size={14} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
