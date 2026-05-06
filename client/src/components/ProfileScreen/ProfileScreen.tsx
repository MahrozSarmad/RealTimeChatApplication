import React, { useState } from 'react';
import { UserProfile } from '../../hooks/useChat';
import styles from './ProfileScreen.module.css';

interface ProfileScreenProps {
  onSave: (profile: UserProfile) => void;
}

const AVATAR_OPTIONS = ['🦊', '🐺', '🦁', '🐯', '🦋', '🐉', '🌙', '⚡', '🔮', '🎯', '🌊', '🔥'];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [nameError, setNameError] = useState(false);
  const [step, setStep] = useState<'identity' | 'avatar'>('identity');

  const handleNext = () => {
    if (!name.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 800);
      return;
    }
    setStep('avatar');
  };

  const handleFinish = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      avatar,
      bio: bio.trim(),
      createdAt: Date.now(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'identity') handleNext();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>Pulse</div>
          <div className={styles.logoSub}>Set up your profile</div>
        </div>

        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${styles.active}`}>1</div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${step === 'avatar' ? styles.active : ''}`}>2</div>
        </div>

        {step === 'identity' ? (
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Who are you?</div>
            <div className={styles.stepSub}>Your name will be visible to others in chat rooms.</div>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="profile-name">Display name <span className={styles.required}>*</span></label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex, Phoenix, Ghost..."
                  maxLength={30}
                  autoComplete="off"
                  autoFocus
                  className={nameError ? styles.inputError : ''}
                  onKeyDown={handleKeyDown}
                />
                {nameError && <span className={styles.fieldError}>Name is required</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="profile-bio">Short bio <span className={styles.optional}>(optional)</span></label>
                <input
                  id="profile-bio"
                  type="text"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="e.g. Just here to vibe..."
                  maxLength={60}
                  autoComplete="off"
                />
              </div>
            </div>

            <button className={styles.nextBtn} onClick={handleNext}>
              Continue →
            </button>
          </div>
        ) : (
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Pick your avatar</div>
            <div className={styles.stepSub}>Choose an emoji that represents you.</div>

            <div className={styles.previewRow}>
              <div className={styles.bigAvatar}>{avatar}</div>
              <div className={styles.previewInfo}>
                <div className={styles.previewName}>{name}</div>
                {bio && <div className={styles.previewBio}>{bio}</div>}
              </div>
            </div>

            <div className={styles.avatarGrid}>
              {AVATAR_OPTIONS.map(em => (
                <button
                  key={em}
                  className={`${styles.avatarOption} ${avatar === em ? styles.selectedAvatar : ''}`}
                  onClick={() => setAvatar(em)}
                  aria-label={`Select ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className={styles.actionRow}>
              <button className={styles.backBtn} onClick={() => setStep('identity')}>← Back</button>
              <button className={styles.finishBtn} onClick={handleFinish}>
                Launch Pulse 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
