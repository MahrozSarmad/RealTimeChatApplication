import React from 'react';
import { UserInfo } from '../../types/chat.types';
import { avatarColor } from '../../utils/helpers';
import styles from './UsersPanel.module.css';

interface UsersPanelProps {
  users: UserInfo[];
  myId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-in panel listing all online users in the current room.
 */
const UsersPanel: React.FC<UsersPanelProps> = ({ users, myId, isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          id="overlay"
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="users-panel"
        className={`${styles.panel} ${isOpen ? styles.open : ''}`}
        aria-label="Online users"
        aria-hidden={!isOpen}
      >
        <div className={styles.panelTitle}>
          Online now
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close users panel"
          >
            ×
          </button>
        </div>

        <div className={styles.usersList} role="list">
          {users.map((u) => (
            <div key={u.id} className={styles.userItem} role="listitem">
              <div
                className={styles.userAvatar}
                style={{ background: avatarColor(u.name) }}
                aria-hidden="true"
              >
                {u.name[0].toUpperCase()}
              </div>
              <span className={styles.userName}>{u.name}</span>
              {u.id === myId && <span className={styles.youBadge}>you</span>}
            </div>
          ))}

          {users.length === 0 && (
            <div className={styles.empty}>No users online</div>
          )}
        </div>
      </aside>
    </>
  );
};

export default UsersPanel;
