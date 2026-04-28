import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerEvent, ChatMessage, UserInfo, ReactionMap, ReplyReference } from '../types/chat.types';
import { getWsUrl } from '../utils/helpers';

// ─── Chat state shape ──────────────────────────────────
export interface ChatState {
  myId: string | null;
  myName: string | null;
  myRoom: string | null;
  connected: boolean;
  users: UserInfo[];
  messages: ChatMessage[];
  reactions: Record<string, ReactionMap>;
  typingUsers: Record<string, string>;   // id -> name
  joinError: string | null;
  isJoined: boolean;
}

export interface UseChatReturn extends ChatState {
  join: (name: string, room: string, roomType: 'public' | 'private', password?: string) => void;
  sendText: (text: string, replyTo?: ReplyReference) => void;
  sendMedia: (mediaType: 'image' | 'file', dataUrl: string, fileName: string, fileSize: number, replyTo?: ReplyReference) => void;
  sendReaction: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
  sendTyping: (isTyping: boolean) => void;
  messageRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  clearJoinError: () => void;
}

const INITIAL_STATE: ChatState = {
  myId: null,
  myName: null,
  myRoom: null,
  connected: false,
  users: [],
  messages: [],
  reactions: {},
  typingUsers: {},
  joinError: null,
  isJoined: false,
};

/**
 * Core WebSocket hook — manages connection lifecycle, reconnection, and all event
 * dispatching. Returns the full chat state and action callbacks.
 */
export function useChat(): UseChatReturn {
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const pendingJoinRef = useRef<{ name: string; room: string; roomType: 'public' | 'private'; password?: string } | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ─── Send helper ────────────────────────────────────
  const send = useCallback((data: object): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // ─── Handle incoming server events ──────────────────
  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'connected':
        setState((prev) => ({ ...prev, myId: event.id, connected: true }));
        // Re-join if we were previously in a room (reconnect case)
        if (pendingJoinRef.current) {
          send({ type: 'join', ...pendingJoinRef.current });
        }
        break;

      case 'join_confirmed':
        setState((prev) => ({
          ...prev,
          myName: event.name,
          myRoom: event.room,
          users: event.users,
          isJoined: true,
          joinError: null,
        }));
        break;

      case 'join_error':
        setState((prev) => ({ ...prev, joinError: event.error, isJoined: false }));
        break;

      case 'history':
        setState((prev) => {
          const reactions: Record<string, ReactionMap> = {};
          event.messages.forEach((m) => {
            if (m.reactions) reactions[m.id] = m.reactions as unknown as ReactionMap;
          });
          return {
            ...prev,
            messages: event.messages,
            reactions,
            users: event.users,
          };
        });
        break;

      case 'message':
        setState((prev) => {
          const reactions = { ...prev.reactions };
          if (event.reactions) reactions[event.id] = event.reactions as unknown as ReactionMap;
          return { ...prev, messages: [...prev.messages, event] };
        });
        break;

      case 'reaction':
        setState((prev) => {
          const reactions = { ...prev.reactions };
          if (!reactions[event.messageId]) reactions[event.messageId] = {};
          const emojiUsers = [...(reactions[event.messageId][event.emoji] ?? [])];
          const idx = emojiUsers.indexOf(event.userId);

          if (event.action === 'add' && idx === -1) emojiUsers.push(event.userId);
          if (event.action === 'remove' && idx !== -1) emojiUsers.splice(idx, 1);

          if (emojiUsers.length === 0) {
            delete reactions[event.messageId][event.emoji];
          } else {
            reactions[event.messageId] = { ...reactions[event.messageId], [event.emoji]: emojiUsers };
          }
          return { ...prev, reactions };
        });
        break;

      case 'user_joined':
        setState((prev) => {
          // Don't show system message for yourself
          if (event.id === prev.myId) return { ...prev, users: event.users };

          const systemMsg: ChatMessage = {
            type: 'system',
            id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text: `${event.name} joined the chat`,
            timestamp: event.timestamp || Date.now(),
          };
          return {
            ...prev,
            users: event.users,
            messages: [...prev.messages, systemMsg],
          };
        });
        break;

      case 'user_left':
        setState((prev) => {
          const typingUsers = { ...prev.typingUsers };
          delete typingUsers[event.id];

          const systemMsg: ChatMessage = {
            type: 'system',
            id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text: `${event.name || 'A user'} left the chat`,
            timestamp: event.timestamp || Date.now(),
          };

          return {
            ...prev,
            users: event.users,
            typingUsers,
            messages: [...prev.messages, systemMsg],
          };
        });
        break;

      case 'typing':
        setState((prev) => {
          const typingUsers = { ...prev.typingUsers };
          if (event.isTyping) {
            typingUsers[event.id] = event.name;
          } else {
            delete typingUsers[event.id];
          }
          return { ...prev, typingUsers };
        });
        break;

      case 'pong':
        break;
    }
  }, [send]);

  // ─── Connect ─────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
    }

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = 1000;
      setState((prev) => ({ ...prev, connected: true }));
    };

    ws.onmessage = (evt) => {
      try {
        const event = JSON.parse(evt.data) as ServerEvent;
        handleEvent(event);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, connected: false }));
      // Only reconnect if we were already in a room
      if (pendingJoinRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          connect();
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 15000);
        }, reconnectDelayRef.current);
      }
    };

    ws.onerror = () => {
      try { ws.close(); } catch { /* ignore */ }
    };
  }, [handleEvent]);

  // ─── Heartbeat ───────────────────────────────────────
  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      send({ type: 'ping' });
    }, 25000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [send]);

  // ─── Cleanup on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ─── Public actions ──────────────────────────────────
  const join = useCallback((
    name: string,
    room: string,
    roomType: 'public' | 'private',
    password?: string
  ) => {
    pendingJoinRef.current = { name, room, roomType, password };
    connect();
    // After connection, 'connected' event will trigger the join send via pendingJoinRef
  }, [connect]);

  const sendText = useCallback((text: string, replyTo?: ReplyReference) => {
    send({ type: 'message', text, ...(replyTo ? { replyTo } : {}) });
  }, [send]);

  const sendMedia = useCallback((
    mediaType: 'image' | 'file',
    dataUrl: string,
    fileName: string,
    fileSize: number,
    replyTo?: ReplyReference
  ) => {
    send({
      type: 'message',
      text: '',
      mediaType,
      mediaData: dataUrl,
      fileName,
      fileSize,
      ...(replyTo ? { replyTo } : {}),
    });
  }, [send]);

  const sendReaction = useCallback((messageId: string, emoji: string, action: 'add' | 'remove') => {
    send({ type: 'reaction', messageId, emoji, action });
  }, [send]);

  const sendTyping = useCallback((isTyping: boolean) => {
    send({ type: 'typing', isTyping });
  }, [send]);

  const clearJoinError = useCallback(() => {
    setState((prev) => ({ ...prev, joinError: null }));
  }, []);

  return {
    ...state,
    join,
    sendText,
    sendMedia,
    sendReaction,
    sendTyping,
    messageRefs,
    clearJoinError,
  };
}
