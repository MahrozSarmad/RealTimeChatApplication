import React from 'react';
import { Toast } from '../../hooks/useToast';
import styles from './ToastContainer.module.css';

interface ToastContainerProps {
  toasts: Toast[];
}

/**
 * Renders all active toast notifications in a fixed bottom-center container.
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast} role="status">
          {t.text}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
