import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '../common/Avatar';
import styles from './CallModal.module.css';

export default function CallModal({ call, onAccept, onReject }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.pulseRing} />
        <div className={styles.pulseRing2} />

        <Avatar src={call.caller_avatar} name={call.caller_name} size={80} />

        <div className={styles.info}>
          <h3>{call.caller_name}</h3>
          <p>{call.call_type === 'video' ? 'Incoming video call' : 'Incoming voice call'}...</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.rejectBtn} onClick={onReject} title="Decline">
            <PhoneOff size={26} />
          </button>
          <button className={styles.acceptBtn} onClick={onAccept} title="Accept">
            {call.call_type === 'video' ? <Video size={26} /> : <Phone size={26} />}
          </button>
        </div>
      </div>
    </div>
  );
}
