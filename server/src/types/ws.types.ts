import { WebSocket } from 'ws';

// ─── WebSocket Message Types ───────────────────────────
export type WsMessageType =
  | 'join'
  | 'message'
  | 'reaction'
  | 'typing'
  | 'ping'
  | 'connected'
  | 'join_confirmed'
  | 'join_error'
  | 'history'
  | 'user_joined'
  | 'user_left'
  | 'pong';

// ─── Shared User ──────────────────────────────────────
export interface UserInfo {
  id: string;
  name: string;
}

// ─── Reply reference ──────────────────────────────────
export interface ReplyReference {
  id: string;
  senderName: string;
  text: string;
}

// ─── Reaction map ─────────────────────────────────────
export type ReactionMap = Record<string, string[]>; // emoji -> userId[]

// ─── Chat Message ─────────────────────────────────────
export interface ChatMessage {
  type: 'message';
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  replyTo?: ReplyReference;
  mediaType?: 'image' | 'file';
  mediaData?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: Record<string, ReactionMap>;
  own?: boolean;
}

// ─── Incoming Client Payloads ─────────────────────────
export interface JoinPayload {
  type: 'join';
  name: string;
  room: string;
  roomType: 'public' | 'private';
  password?: string;
}

export interface MessagePayload {
  type: 'message';
  text?: string;
  mediaType?: 'image' | 'file';
  mediaData?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: ReplyReference;
}

export interface ReactionPayload {
  type: 'reaction';
  messageId: string;
  emoji: string;
  action: 'add' | 'remove';
}

export interface TypingPayload {
  type: 'typing';
  isTyping: boolean;
}

export interface PingPayload {
  type: 'ping';
}

export type IncomingPayload =
  | JoinPayload
  | MessagePayload
  | ReactionPayload
  | TypingPayload
  | PingPayload;

// ─── Outgoing Server Events ───────────────────────────
export interface ConnectedEvent {
  type: 'connected';
  id: string;
}

export interface JoinConfirmedEvent {
  type: 'join_confirmed';
  name: string;
  room: string;
  users: UserInfo[];
}

export interface JoinErrorEvent {
  type: 'join_error';
  error: string;
}

export interface HistoryEvent {
  type: 'history';
  messages: ChatMessage[];
  room: string;
  users: UserInfo[];
}

export interface UserJoinedEvent {
  type: 'user_joined';
  id: string;
  name: string;
  users: UserInfo[];
  timestamp: number;
}

export interface UserLeftEvent {
  type: 'user_left';
  id: string;
  name: string | null;
  users: UserInfo[];
  timestamp: number;
}

export interface ReactionEvent {
  type: 'reaction';
  messageId: string;
  emoji: string;
  userId: string;
  action: 'add' | 'remove';
}

export interface TypingEvent {
  type: 'typing';
  id: string;
  name: string;
  isTyping: boolean;
}

export interface PongEvent {
  type: 'pong';
}

export type OutgoingEvent =
  | ConnectedEvent
  | JoinConfirmedEvent
  | JoinErrorEvent
  | HistoryEvent
  | UserJoinedEvent
  | UserLeftEvent
  | ChatMessage
  | ReactionEvent
  | TypingEvent
  | PongEvent;

// ─── Room State ───────────────────────────────────────
export interface RoomState {
  messages: ChatMessage[];
  clients: Set<WebSocket>;
  type: 'public' | 'private';
  passwordHash: string | null;
  reactions: Record<string, ReactionMap>;
}

// ─── Client State ─────────────────────────────────────
export interface ClientState {
  id: string;
  name: string | null;
  room: string | null;
}
