import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerEvent, ChatMessage, UserInfo, ReactionMap, ReplyReference, JoinedGroup } from '../types/chat.types';
import { getWsUrl } from '../utils/helpers';

const GROUPS_KEY = 'pulse_joined_groups';
const USERNAME_KEY = 'pulse_username';
const PROFILE_KEY = 'pulse_user_profile';

export interface UserProfile {
  name: string;
  avatar: string; // emoji or initial
  bio: string;
  createdAt: number;
}

function loadJoinedGroups(): JoinedGroup[] {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]'); }
  catch { return []; }
}
function saveJoinedGroups(groups: JoinedGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}
function upsertGroup(groups: JoinedGroup[], group: JoinedGroup): JoinedGroup[] {
  return [group, ...groups.filter(g => g.room !== group.room)].slice(0, 20);
}
function removeGroup(groups: JoinedGroup[], room: string): JoinedGroup[] {
  return groups.filter(g => g.room !== room);
}

export interface ChatState {
  myId: string | null;
  myName: string | null;
  myRoom: string | null;
  connected: boolean;
  users: UserInfo[];
  messages: ChatMessage[];
  reactions: Record<string, ReactionMap>;
  typingUsers: Record<string, string>;
  joinError: string | null;
  isJoined: boolean;
  isAdmin: boolean;
  screen: 'profile' | 'join' | 'dashboard' | 'chat';
  joinedGroups: JoinedGroup[];
  savedUsername: string | null;
  userProfile: UserProfile | null;
  systemNotification: string | null;
}

export interface UseChatReturn extends ChatState {
  join: (room: string, roomType: 'public' | 'private', password?: string, isCreating?: boolean) => void;
  sendText: (text: string, replyTo?: ReplyReference) => void;
  sendMedia: (mediaType: 'image' | 'file', dataUrl: string, fileName: string, fileSize: number, replyTo?: ReplyReference) => void;
  sendReaction: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
  sendTyping: (isTyping: boolean) => void;
  messageRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  clearJoinError: () => void;
  leaveGroup: () => void;
  exitChat: () => void;
  rejoinGroup: (group: JoinedGroup) => void;
  goToJoin: () => void;
  saveProfile: (profile: UserProfile) => void;
}

function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); }
  catch { return null; }
}
function saveProfileToStorage(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(USERNAME_KEY, profile.name);
}

const getInitialState = (): ChatState => {
  const groups = loadJoinedGroups();
  const profile = loadProfile();
  const screen = !profile ? 'profile' : groups.length > 0 ? 'dashboard' : 'join';
  return {
    myId: null,
    myName: profile?.name ?? null,
    myRoom: null,
    connected: false,
    users: [],
    messages: [],
    reactions: {},
    typingUsers: {},
    joinError: null,
    isJoined: false,
    isAdmin: false,
    screen,
    joinedGroups: groups,
    savedUsername: profile?.name ?? localStorage.getItem(USERNAME_KEY),
    userProfile: profile,
    systemNotification: null,
  };
};

export function useChat(): UseChatReturn {
  const [state, setState] = useState<ChatState>(getInitialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const pendingJoinRef = useRef<{ name: string; room: string; roomType: 'public' | 'private'; password?: string; isCreating?: boolean } | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sysNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSystemNotification = useCallback((text: string) => {
    if (sysNotifTimerRef.current) clearTimeout(sysNotifTimerRef.current);
    setState((prev) => ({ ...prev, systemNotification: text }));
    sysNotifTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, systemNotification: null }));
    }, 3000);
  }, []);

  const send = useCallback((data: object): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'connected':
        setState((prev) => ({
          ...prev,
          myId: event.id,
          connected: true,
        }));
        if (pendingJoinRef.current) send({ type: 'join', ...pendingJoinRef.current });
        break;
      case 'join_confirmed':
        setState((prev) => {
          const group: JoinedGroup = {
            room: event.room,
            roomType: pendingJoinRef.current?.roomType ?? 'public',
            password: pendingJoinRef.current?.password,
            lastJoined: Date.now(),
            isAdmin: pendingJoinRef.current?.isCreating ?? false,
          };
          const newGroups = upsertGroup(prev.joinedGroups, group);
          saveJoinedGroups(newGroups);
          const name = event.name;
          localStorage.setItem(USERNAME_KEY, name);
          return { ...prev, myName: name, myRoom: event.room, users: event.users, isJoined: true, joinError: null, screen: 'chat', joinedGroups: newGroups, savedUsername: name, isAdmin: group.isAdmin };
        });
        break;
      case 'join_error':
        setState((prev) => ({ ...prev, joinError: event.error, isJoined: false }));
        break;
      case 'history':
        setState((prev) => {
          const reactions: Record<string, ReactionMap> = {};
          event.messages.forEach((m) => { if (m.reactions) reactions[m.id] = m.reactions as unknown as ReactionMap; });
          return { ...prev, messages: event.messages, reactions, users: event.users };
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
          if (emojiUsers.length === 0) delete reactions[event.messageId][event.emoji];
          else reactions[event.messageId] = { ...reactions[event.messageId], [event.emoji]: emojiUsers };
          return { ...prev, reactions };
        });
        break;
      case 'user_joined':
        setState((prev) => ({ ...prev, users: event.users }));
        showSystemNotification(`${event.name} joined the room`);
        break;
      case 'user_left': {
        const leftName = event.name ?? 'Someone';
        setState((prev) => {
          const typingUsers = { ...prev.typingUsers };
          delete typingUsers[event.id];
          return { ...prev, users: event.users, typingUsers };
        });
        showSystemNotification(`${leftName} left the group`);
        break;
      }
      case 'typing':
        setState((prev) => {
          const typingUsers = { ...prev.typingUsers };
          if (event.isTyping) typingUsers[event.id] = event.name;
          else delete typingUsers[event.id];
          return { ...prev, typingUsers };
        });
        break;
      case 'pong':
        // Clear pong timeout since we received a response
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        break;
    }
  }, [send, showSystemNotification]);

  const connect = useCallback(() => {
    if (wsRef.current) { try { wsRef.current.close(); } catch { /* ignore */ } }
    
    // Clear any pending pong timeout
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('[WS] Connected');
      reconnectDelayRef.current = 1000;
      setState((prev) => ({ ...prev, connected: true }));
    };
    
    ws.onmessage = (evt) => {
      try {
        handleEvent(JSON.parse(evt.data) as ServerEvent);
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setState((prev) => ({ ...prev, connected: false }));
      
      // Clear pong timeout on close
      if (pongTimeoutRef.current) {
        clearTimeout(pongTimeoutRef.current);
        pongTimeoutRef.current = null;
      }
      
      if (pendingJoinRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          console.log('[WS] Attempting reconnect, delay:', reconnectDelayRef.current);
          connect();
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 15000);
        }, reconnectDelayRef.current);
      }
    };
    
    ws.onerror = (evt) => {
      console.error('[WS] Error:', evt);
      try { ws.close(); } catch { /* ignore */ }
    };
  }, [handleEvent]);

  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      // Clear any existing pong timeout before sending new ping
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      
      // Send ping - if connection not open, skip
      if (!send({ type: 'ping' })) return;
      
      // Set timeout for pong response (5 seconds)
      // If pong doesn't arrive, force reconnection
      pongTimeoutRef.current = setTimeout(() => {
        console.warn('[Heartbeat] Pong timeout - connection may be dead, forcing reconnect');
        if (wsRef.current) {
          try { wsRef.current.close(); } catch { /* ignore */ }
        }
      }, 5000);
    }, 25000);
    
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const join = useCallback((room: string, roomType: 'public' | 'private', password?: string, isCreating?: boolean) => {
    setState((prev) => {
      const name = prev.userProfile?.name ?? prev.savedUsername ?? 'Anonymous';
      pendingJoinRef.current = { name, room, roomType, password, isCreating: isCreating ?? false };
      localStorage.setItem(USERNAME_KEY, name);
      connect();
      return { ...prev, myName: name, savedUsername: name };
    });
  }, [connect]);

  const rejoinGroup = useCallback((group: JoinedGroup) => {
    setState((prev) => {
      const name = prev.userProfile?.name ?? prev.myName ?? prev.savedUsername ?? 'Anonymous';
      pendingJoinRef.current = { name, room: group.room, roomType: group.roomType, password: group.password, isCreating: false };
      connect();
      return { ...prev, messages: [], reactions: {}, typingUsers: {}, myName: name };
    });
  }, [connect]);

  const exitChat = useCallback(() => {
    // Send silent exit so server doesn't broadcast "user_left"
    send({ type: 'exit_chat' });
    // Give the message a moment to send before closing
    setTimeout(() => {
      if (wsRef.current) { try { wsRef.current.close(); } catch { /* ignore */ } }
    }, 100);
    pendingJoinRef.current = null;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    setState((prev) => ({ ...prev, screen: 'dashboard', isJoined: false, messages: [], reactions: {}, typingUsers: {}, myRoom: null, connected: false }));
  }, [send]);

  const leaveGroup = useCallback(() => {
    send({ type: 'leave_group' });
    setState((prev) => {
      const newGroups = removeGroup(prev.joinedGroups, prev.myRoom ?? '');
      saveJoinedGroups(newGroups);
      if (wsRef.current) { try { wsRef.current.close(); } catch { /* ignore */ } }
      pendingJoinRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      return { ...prev, screen: newGroups.length > 0 ? 'dashboard' : 'join', isJoined: false, messages: [], reactions: {}, typingUsers: {}, myRoom: null, connected: false, joinedGroups: newGroups };
    });
  }, [send]);

  const sendText = useCallback((text: string, replyTo?: ReplyReference) => {
    send({ type: 'message', text, ...(replyTo ? { replyTo } : {}) });
  }, [send]);

  const sendMedia = useCallback((mediaType: 'image' | 'file', dataUrl: string, fileName: string, fileSize: number, replyTo?: ReplyReference) => {
    send({ type: 'message', text: '', mediaType, mediaData: dataUrl, fileName, fileSize, ...(replyTo ? { replyTo } : {}) });
  }, [send]);

  const sendReaction = useCallback((messageId: string, emoji: string, action: 'add' | 'remove') => {
    send({ type: 'reaction', messageId, emoji, action });
  }, [send]);

  const sendTyping = useCallback((isTyping: boolean) => {
    send({ type: 'typing', isTyping });
  }, [send]);

  const saveProfile = useCallback((profile: UserProfile) => {
    saveProfileToStorage(profile);
    setState((prev) => {
      const groups = prev.joinedGroups;
      const screen = groups.length > 0 ? 'dashboard' : 'join';
      return { ...prev, userProfile: profile, myName: profile.name, savedUsername: profile.name, screen };
    });
  }, []);

  const clearJoinError = useCallback(() => { setState((prev) => ({ ...prev, joinError: null })); }, []);

  const goToJoin = useCallback(() => {
    setState((prev) => ({ ...prev, screen: 'join', joinError: null }));
  }, []);

  return { ...state, join, sendText, sendMedia, sendReaction, sendTyping, messageRefs, clearJoinError, leaveGroup, exitChat, rejoinGroup, goToJoin, saveProfile };
}
