import { useCallback, useRef } from 'react';

/**
 * Debounced typing indicator hook.
 * Returns start/stop functions to send typing events without flooding the server.
 */
export function useTyping(sendTyping: (isTyping: boolean) => void) {
  const isTypingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2500);
  }, [sendTyping]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [sendTyping]);

  return { startTyping, stopTyping };
}
