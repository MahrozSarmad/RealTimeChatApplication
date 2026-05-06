// ─── Shared user info ─────────────────────────────────
export interface UserInfo {
  id: string;
  name: string;
}

// ─── Joined group record (stored locally) ─────────────
export interface JoinedGroup {
  room: string;
  roomType: 'public' | 'private';
  password?: string;
  lastJoined: number;
  isAdmin?: boolean;
}

// ─── Reply reference ──────────────────────────────────
export interface ReplyReference {
  id: string;
  senderName: string;
  text: string;
}

// ─── Reaction map: emoji -> userId[] ─────────────────
export type ReactionMap = Record<string, string[]>;

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
  reactions?: ReactionMap;
  own?: boolean;
}

// ─── Outgoing payloads to server ─────────────────────
export interface JoinPayload {
  type: 'join';
  name: string;
  room: string;
  roomType: 'public' | 'private';
  password?: string;
}

export interface SendMessagePayload {
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

export interface LeaveGroupPayload {
  type: 'leave_group';
}

// ─── Incoming server events ───────────────────────────
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

export type ServerEvent =
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
