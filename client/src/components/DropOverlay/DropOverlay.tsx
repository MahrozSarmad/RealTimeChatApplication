import React, { useEffect, useCallback, useState } from 'react';
import { readFileAsDataUrl } from '../../utils/helpers';
import styles from './DropOverlay.module.css';

interface DropOverlayProps {
  enabled: boolean;
  onDropFiles: (files: File[]) => void;
}

/**
 * Full-screen drag & drop overlay — shows when a file is dragged into the window.
 */
const DropOverlay: React.FC<DropOverlayProps> = ({ enabled, onDropFiles }) => {
  const [active, setActive] = useState(false);
  const counterRef = React.useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    counterRef.current++;
    setActive(true);
  }, [enabled]);

  const handleDragLeave = useCallback(() => {
    counterRef.current--;
    if (counterRef.current <= 0) {
      counterRef.current = 0;
      setActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    counterRef.current = 0;
    setActive(false);
    if (!enabled) return;
    const files = Array.from(e.dataTransfer?.files ?? []);
    onDropFiles(files);
  }, [enabled, onDropFiles]);

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!active) return null;

  return (
    <div id="drop-overlay" className={styles.overlay} aria-hidden="true">
      <div className={styles.icon}>📎</div>
      <div className={styles.text}>Drop to send</div>
    </div>
  );
};

export default DropOverlay;
