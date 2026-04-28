import React, { useState } from 'react';
import styles from './ScheduledMessage.module.css';

interface ScheduledMessageProps {
  onSchedule: (text: string, delayMs: number) => void;
  onClose: () => void;
  currentText: string;
}

const ScheduledMessage: React.FC<ScheduledMessageProps> = ({ onSchedule, onClose, currentText }) => {
  const [seconds, setSeconds] = useState(10);

  const handleConfirm = () => {
    if (!currentText.trim()) return;
    onSchedule(currentText, seconds * 1000);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>🕒 Schedule Message</h3>
        <p className={styles.desc}>Message will be sent in:</p>
        
        <div className={styles.selector}>
          <input 
            type="range" 
            min="5" 
            max="300" 
            value={seconds} 
            onChange={e => setSeconds(parseInt(e.target.value))} 
            className={styles.slider}
          />
          <div className={styles.timeDisplay}>{seconds} seconds</div>
        </div>

        <div className={styles.preview}>
          <strong>Preview:</strong>
          <div className={styles.previewText}>{currentText || '(No text entered)'}</div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button 
            className={styles.confirmBtn} 
            onClick={handleConfirm}
            disabled={!currentText.trim()}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledMessage;
