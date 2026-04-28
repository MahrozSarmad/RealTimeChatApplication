import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  typingUsers: Record<string, string>;
}

/**
 * Shows an animated "X is typing..." indicator above the input area.
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const names = Object.values(typingUsers);

  let label = '';
  if (names.length === 1) label = `${names[0]} is typing...`;
  else if (names.length === 2) label = `${names[0]} and ${names[1]} are typing...`;
  else if (names.length > 2) label = `${names.length} people are typing...`;

  return (
    <div
      id="typing-indicator"
      className={`${styles.indicator} ${names.length === 0 ? styles.hidden : ''}`}
      aria-live="polite"
    >
      {names.length > 0 && (
        <>
          <div className={styles.dots}>
            <span /><span /><span />
          </div>
          <span id="typing-text">{label}</span>
        </>
      )}
    </div>
  );
};

export default TypingIndicator;
