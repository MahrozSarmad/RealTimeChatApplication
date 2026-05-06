import { useCallback, useRef, useState } from 'react';

export interface Toast {
  id: string;
  text: string;
}

/**
 * Simple toast notification queue hook.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((text: string) => {
    const id = String(++counterRef.current);
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}
