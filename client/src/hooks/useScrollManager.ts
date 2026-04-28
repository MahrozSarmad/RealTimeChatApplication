import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Tracks scroll position in the messages container.
 * Exposes atBottom flag, unread count, and a scrollToBottom helper.
 */
export function useScrollManager(messagesLength: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToBottom = useCallback((force = false) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    if (force) setUnreadCount(0);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (atBottom) {
      scrollToBottom(false);
    } else {
      setUnreadCount((c) => c + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLength]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(isAtBottom);
    if (isAtBottom) setUnreadCount(0);
  }, []);

  return { containerRef, atBottom, unreadCount, scrollToBottom, handleScroll };
}
