import React, { useRef, useState } from 'react';
import styles from './JoinScreen.module.css';

interface JoinScreenProps {
  onJoin: (room: string, roomType: 'public' | 'private', password?: string, isCreating?: boolean) => void;
  error: string | null;
  onClearError: () => void;
  username?: string | null;
  userAvatar?: string;
  onBack?: () => void;
}

/**
 * Join/create a room screen. Username comes from the user's profile.
 */
const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin, error, onClearError, username, userAvatar, onBack }) => {
  const roomRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    const room = roomRef.current?.value.trim() || 'general';
    const password = passwordRef.current?.value.trim() ?? '';

    setIsLoading(true);
    onClearError();
    // For join mode: always pass password (server validates if room is private)
    // For create mode: only pass if private room
    const effectivePassword = mode === 'join' ? (password || undefined) : (roomType === 'private' ? password : undefined);
    onJoin(room, roomType, effectivePassword, mode === 'create');
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>← Dashboard</button>
          )}
          <div className={styles.logo}>Pulse</div>
          <div className={styles.logoSub}>Local network chat</div>
        </div>

        {username && (
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{userAvatar ?? '🎯'}</span>
            <span className={styles.userChipName}>{username}</span>
            <span className={styles.userChipLabel}>active profile</span>
          </div>
        )}

        <div className={styles.divider} />

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Mode toggle */}
        <div className={styles.modeRow}>
          <button
            className={`${styles.modeBtn} ${mode === 'join' ? styles.modeActive : ''}`}
            onClick={() => setMode('join')}
          >
            🔍 Join Room
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'create' ? styles.modeActive : ''}`}
            onClick={() => setMode('create')}
          >
            ✨ Create Room
          </button>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label htmlFor="room-input">
              {mode === 'create' ? 'Room name' : 'Room to join'}
            </label>
            <input
              id="room-input"
              ref={roomRef}
              type="text"
              placeholder={mode === 'create' ? 'e.g. design-team, lounge...' : 'e.g. general, dev-talk...'}
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {mode === 'create' && (
            <div className={styles.field}>
              <label>Room type</label>
              <div className={styles.roomTypeRow}>
                <button
                  className={`${styles.roomTypeBtn} ${roomType === 'public' ? styles.active : ''}`}
                  onClick={() => setRoomType('public')}
                >
                  🌐 Public
                </button>
                <button
                  className={`${styles.roomTypeBtn} ${roomType === 'private' ? styles.active : ''}`}
                  onClick={() => setRoomType('private')}
                >
                  🔒 Private
                </button>
              </div>
            </div>
          )}

          {/* Always show password field when joining (room may be private) */}
          {/* Only show when creating if room type is private */}
          {(mode === 'join' || roomType === 'private') && (
            <div className={styles.field}>
              <label htmlFor="password-input">
                {mode === 'create' ? 'Set room password' : 'Room password (if private)'}
              </label>
              <input
                id="password-input"
                ref={passwordRef}
                type="password"
                placeholder={mode === 'create' ? 'Choose a password...' : 'Leave blank for public rooms'}
                maxLength={50}
                autoComplete="off"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
        </div>

        <button
          className={styles.joinBtn}
          onClick={handleJoin}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : mode === 'create' ? 'Create & Enter →' : 'Join Room →'}
        </button>

        <p className={styles.hint}>
          All devices on the same WiFi can chat together.
          <br />
          Share the same room name to connect.
        </p>
      </div>
    </div>
  );
};

export default JoinScreen;
