import { useState, useCallback, useEffect } from 'react';

export interface ScheduledTask {
  id: string;
  text: string;
  time: number; // timestamp
}

/**
 * Modular hook to manage scheduled messages.
 * Keeps logic separate from the main chat hook.
 */
export function useScheduledMessage(onSend: (text: string) => void) {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledTask[]>([]);

  const scheduleMessage = useCallback((text: string, delayMs: number) => {
    const time = Date.now() + delayMs;
    const id = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    setScheduledMessages(prev => [...prev, { id, text, time }]);
    return id;
  }, []);

  const cancelScheduled = useCallback((id: string) => {
    setScheduledMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  // Timer check loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setScheduledMessages(prev => {
        const toSend = prev.filter(m => m.time <= now);
        const remaining = prev.filter(m => m.time > now);
        
        toSend.forEach(m => onSend(m.text));
        
        return remaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onSend]);

  return {
    scheduledMessages,
    scheduleMessage,
    cancelScheduled
  };
}
