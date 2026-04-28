import React from 'react';
import { UserInfo } from '../../types/chat.types';
import { avatarColor } from '../../utils/helpers';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  room: string;
  isPrivate: boolean;
  connected: boolean;
  users: UserInfo[];
  lightMode: boolean;
  onToggleTheme: () => void;
  onOpenUsers: () => void;
  unreadCount: number;
}

/**
 * Top header bar showing room name, connection status, theme toggle, and user count.
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  isPrivate,
  connected,
  users,
  lightMode,
  onToggleTheme,
  onOpenUsers,
  unreadCount,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.roomIcon}>💬</div>
        <div className={styles.roomInfo}>
          <div className={styles.roomName}>#{room}</div>
          <div className={styles.roomStatus}>
            <div className={`${styles.statusDot} ${connected ? '' : styles.offline}`} />
            <span>{connected ? 'Connected' : 'Reconnecting...'}</span>
            {isPrivate && <span className={styles.lockBadge}>Private</span>}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <button
          id="theme-btn"
          className={styles.headerBtn}
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {lightMode ? '☀️' : '🌙'}
        </button>

        <button className={styles.usersPill} onClick={onOpenUsers} aria-label="Show online users">
          <div className={styles.usersAvatars}>
            {users.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className={styles.miniAvatar}
                style={{ background: avatarColor(u.name) }}
              >
                {u.name[0].toUpperCase()}
              </div>
            ))}
          </div>
          <span>{users.length} online</span>
        </button>

        {unreadCount > 0 && (
          <div className={styles.unreadBadge} aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
