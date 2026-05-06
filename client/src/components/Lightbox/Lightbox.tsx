import React from 'react';
import styles from './Lightbox.module.css';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

/**
 * Full-screen image lightbox.
 */
const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div
      id="lightbox"
      className={styles.lightbox}
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        id="lightbox-close"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close lightbox"
      >
        ✕
      </button>
      <img className={styles.image} src={src} alt="Full size preview" />
    </div>
  );
};

export default Lightbox;
