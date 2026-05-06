import React, { useState } from 'react';
import { UserInfo } from '../../types/chat.types';
import { avatarColor } from '../../utils/helpers';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  room: string;
  isPrivate: boolean;
  isAdmin: boolean;
  roomPassword?: string;
  connected: boolean;
  users: UserInfo[];
  lightMode: boolean;
  onToggleTheme: () => void;
  onOpenUsers: () => void;
  unreadCount: number;
  onExitChat: () => void;
  onLeaveGroup: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  isPrivate,
  isAdmin,
  roomPassword,
  connected,
  users,
  lightMode,
  onToggleTheme,
  onOpenUsers,
  unreadCount,
  onExitChat,
  onLeaveGroup,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLeaveClick = () => {
    setShowMenu(false);
    setConfirmLeave(true);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={onExitChat} title="Back to dashboard" aria-label="Back">
          ←
        </button>
        <div className={styles.roomIcon}>💬</div>
        <div className={styles.roomInfo}>
          <div className={styles.roomName}>#{room}</div>
          <div className={styles.roomStatus}>
            <div className={`${styles.statusDot} ${connected ? '' : styles.offline}`} />
            <span>{connected ? 'Connected' : 'Reconnecting...'}</span>
            {isPrivate && <span className={styles.lockBadge}>Private</span>}
            {isAdmin && <span className={styles.adminBadge}>👑 Admin</span>}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <button
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

        {/* More menu */}
        <div className={styles.menuWrap}>
          <button
            className={styles.headerBtn}
            onClick={() => setShowMenu((v) => !v)}
            title="More options"
            aria-label="More options"
          >
            ⋮
          </button>
          {showMenu && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
              <div className={styles.menu}>
                <button className={styles.menuItem} onClick={() => { setShowMenu(false); onOpenUsers(); }}>
                  👥 View members
                </button>
                {isAdmin && (
                  <button className={styles.menuItem} onClick={() => { setShowMenu(false); setShowRoomInfo(true); }}>
                    🔑 Room info
                  </button>
                )}
                <button className={styles.menuItem} onClick={() => { setShowMenu(false); onExitChat(); }}>
                  ← Back to dashboard
                </button>
                <div className={styles.menuDivider} />
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLeaveClick}>
                  🚪 Leave group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Leave confirm modal */}
      {confirmLeave && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmLeave(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🚪</div>
            <div className={styles.modalTitle}>Leave group?</div>
            <div className={styles.modalBody}>
              You'll be removed from <strong>#{room}</strong>. Others will be notified.
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmLeave(false)}>Cancel</button>
              <button className={styles.leaveBtn} onClick={() => { setConfirmLeave(false); onLeaveGroup(); }}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Room Info modal */}
      {showRoomInfo && isAdmin && (
        <div className={styles.modalBackdrop} onClick={() => setShowRoomInfo(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🔑</div>
            <div className={styles.modalTitle}>Room Info</div>
            <div className={styles.modalBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Room Name</span>
                <span className={styles.infoValue}>#{room}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Type</span>
                <span className={styles.infoValue}>{isPrivate ? '🔒 Private' : '🌐 Public'}</span>
              </div>
              {roomPassword && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Password</span>
                  <div className={styles.passwordReveal}>
                    <span className={styles.infoValue}>
                      {passwordVisible ? roomPassword : '••••••••'}
                    </span>
                    <button
                      className={styles.revealBtn}
                      onClick={() => setPasswordVisible(v => !v)}
                    >
                      {passwordVisible ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}
              <div className={styles.adminNote}>
                Only you (the admin) can see this information.
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowRoomInfo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ChatHeader;
