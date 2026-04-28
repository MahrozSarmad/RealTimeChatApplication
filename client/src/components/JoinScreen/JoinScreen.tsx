import React, { useRef, useState } from 'react';
import styles from './JoinScreen.module.css';

interface JoinScreenProps {
  onJoin: (name: string, room: string, roomType: 'public' | 'private', password?: string) => void;
  error: string | null;
  onClearError: () => void;
}

/**
 * The initial join/login screen where users set their name, room, and room type.
 */
const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin, error, onClearError }) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [nameError, setNameError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    const name = nameRef.current?.value.trim() ?? '';
    const room = roomRef.current?.value.trim() || 'general';
    const password = passwordRef.current?.value.trim() ?? '';

    if (!name) {
      setNameError(true);
      nameRef.current?.focus();
      setTimeout(() => setNameError(false), 1000);
      return;
    }

    setIsLoading(true);
    onClearError();
    onJoin(name, room, roomType, roomType === 'private' ? password : undefined);
    // Reset loading if error comes back
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logo}>Pulse</div>
          <div className={styles.logoSub}>Local network chat</div>
        </div>

        <div className={styles.divider} />

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Fields */}
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label htmlFor="name-input">Your name</label>
            <input
              id="name-input"
              ref={nameRef}
              type="text"
              placeholder="Enter your name"
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={nameError ? styles.inputError : ''}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="room-input">Room</label>
            <input
              id="room-input"
              ref={roomRef}
              type="text"
              placeholder="Room name (e.g. general)"
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.field}>
            <label>Room type</label>
            <div className={styles.roomTypeRow}>
              <button
                id="type-public"
                className={`${styles.roomTypeBtn} ${roomType === 'public' ? styles.active : ''}`}
                onClick={() => setRoomType('public')}
              >
                Public
              </button>
              <button
                id="type-private"
                className={`${styles.roomTypeBtn} ${roomType === 'private' ? styles.active : ''}`}
                onClick={() => setRoomType('private')}
              >
                Private
              </button>
            </div>
          </div>

          {roomType === 'private' && (
            <div className={styles.field}>
              <label htmlFor="password-input">Room password</label>
              <input
                id="password-input"
                ref={passwordRef}
                type="password"
                placeholder="Set or enter room password"
                maxLength={50}
                autoComplete="off"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
        </div>

        <button
          id="join-btn"
          className={styles.joinBtn}
          onClick={handleJoin}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Join Room →'}
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
