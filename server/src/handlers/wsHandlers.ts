import { WebSocket } from 'ws';
import {
  IncomingPayload,
  JoinPayload,
  MessagePayload,
  ReactionPayload,
  TypingPayload,
  ChatMessage,
} from '../types/ws.types';
import {
  getClientState,
  setClientState,
  getRoom,
  getOrCreateRoom,
  getRoomUserList,
  broadcastToRoom,
  sendToClient,
  validateRoomPassword,
  applyReaction,
  persistRoom,
  persistMessage,
  loadRoomHistory,
  loadRoomFromDB,
} from '../services/roomManager';
import { generateId, sanitize, hashPassword } from '../utils/helpers';

// ─── Handler: join ────────────────────────────────────
export async function handleJoin(ws: WebSocket, payload: JoinPayload): Promise<void> {
  const client = getClientState(ws);
  if (!client) return;

  const name = sanitize(payload.name, 30) || 'Anonymous';
  const roomId = sanitize(payload.room, 30) || 'general';
  const roomType = payload.roomType === 'private' ? 'private' : 'public';
  const password = typeof payload.password === 'string' ? payload.password.trim() : '';

  // Leave old room
  if (client.room) {
    const oldRoom = getRoom(client.room);
    if (oldRoom) {
      oldRoom.clients.delete(ws);
      broadcastToRoom(client.room, {
        type: 'user_left',
        id: client.id,
        name: client.name,
        users: getRoomUserList(client.room),
        timestamp: Date.now(),
      });
    }
  }

  // Try to load room config from DB if not in memory
  let existingRoom = getRoom(roomId);
  if (!existingRoom) {
    const dbRoom = await loadRoomFromDB(roomId);
    if (dbRoom) {
      getOrCreateRoom(roomId, dbRoom.type, dbRoom.passwordHash);
      existingRoom = getRoom(roomId);
    }
  }

  // Password check
  if (!validateRoomPassword(existingRoom, password)) {
    sendToClient(ws, { type: 'join_error', error: 'Incorrect room password.' });
    return;
  }

  // Determine password hash to store
  let passwordHash: string | null = null;
  if (roomType === 'private' && password) {
    passwordHash = existingRoom ? existingRoom.passwordHash : hashPassword(password);
  } else if (existingRoom) {
    passwordHash = existingRoom.passwordHash;
  }

  // Persist room to DB
  await persistRoom(roomId, roomType, passwordHash);

  setClientState(ws, { name, room: roomId });

  const roomObj = getOrCreateRoom(roomId, roomType, passwordHash);
  roomObj.clients.add(ws);

  // Load history — prefer DB, fall back to in-memory
  let history = await loadRoomHistory(roomId, 100);
  if (history.length === 0) {
    history = roomObj.messages.slice(-100);
  }

  // Attach reactions and mark sender's own messages
  const clientId = getClientState(ws)?.id;
  const enrichedHistory = history.map((m) => ({
    ...m,
    reactions: roomObj.reactions[m.id] ?? {},
    ...(m.senderId === clientId ? { own: true } : {}),
  }));

  sendToClient(ws, {
    type: 'history',
    messages: enrichedHistory,
    room: roomId,
    users: getRoomUserList(roomId),
  });

  broadcastToRoom(
    roomId,
    {
      type: 'user_joined',
      id: client.id,
      name,
      users: getRoomUserList(roomId),
      timestamp: Date.now(),
    },
    ws
  );

  sendToClient(ws, {
    type: 'join_confirmed',
    name,
    room: roomId,
    users: getRoomUserList(roomId),
  });
}

// ─── Handler: message ─────────────────────────────────
export async function handleMessage(ws: WebSocket, payload: MessagePayload): Promise<void> {
  const client = getClientState(ws);
  if (!client?.room || !client.name) return;

  const hasMedia =
    (payload.mediaType === 'image' || payload.mediaType === 'file') && payload.mediaData;
  const text = sanitize(payload.text ?? '', 2000);
  if (!text && !hasMedia) return;

  let replyTo = undefined;
  if (payload.replyTo?.id) {
    replyTo = {
      id: String(payload.replyTo.id),
      senderName: sanitize(payload.replyTo.senderName ?? ''),
      text: sanitize(payload.replyTo.text ?? ''),
    };
  }

  const messageObj: ChatMessage = {
    type: 'message',
    id: generateId(),
    senderId: client.id,
    senderName: client.name,
    text,
    timestamp: Date.now(),
    replyTo,
  };

  if (hasMedia) {
    messageObj.mediaType = payload.mediaType as 'image' | 'file';
    messageObj.mediaData = payload.mediaData;
    messageObj.fileName = sanitize(payload.fileName ?? 'file');
    messageObj.fileSize = typeof payload.fileSize === 'number' ? payload.fileSize : 0;
  }

  const room = getRoom(client.room);
  if (!room) return;

  // Store in memory (cap at 500)
  room.messages.push(messageObj);
  if (room.messages.length > 500) {
    room.messages = room.messages.slice(-500);
  }

  // Persist to DB (attach room for the model)
  await persistMessage({ ...messageObj, _room: client.room } as any);

  // Send confirmed copy back to sender with own flag
  sendToClient(ws, { ...messageObj, own: true });
  broadcastToRoom(client.room, messageObj, ws);
}

// ─── Handler: reaction ────────────────────────────────
export function handleReaction(ws: WebSocket, payload: ReactionPayload): void {
  const client = getClientState(ws);
  if (!client?.room || !client.name) return;

  const { messageId, emoji, action } = payload;
  if (!messageId || !emoji || !['add', 'remove'].includes(action)) return;

  applyReaction(client.room, messageId, emoji, client.id, action);

  const reactionEvent = {
    type: 'reaction',
    messageId,
    emoji,
    userId: client.id,
    action,
  };

  sendToClient(ws, reactionEvent);
  broadcastToRoom(client.room, reactionEvent, ws);
}

// ─── Handler: typing ─────────────────────────────────
export function handleTyping(ws: WebSocket, payload: TypingPayload): void {
  const client = getClientState(ws);
  if (!client?.room || !client.name) return;

  broadcastToRoom(
    client.room,
    {
      type: 'typing',
      id: client.id,
      name: client.name,
      isTyping: !!payload.isTyping,
    },
    ws
  );
}

// ─── Handler: leave_group ─────────────────────────────
export function handleLeaveGroup(ws: WebSocket): void {
  const client = getClientState(ws);
  if (!client?.room || !client.name) return;

  const room = getRoom(client.room);
  if (room) {
    room.clients.delete(ws);
    broadcastToRoom(client.room, {
      type: 'user_left',
      id: client.id,
      name: client.name,
      users: getRoomUserList(client.room),
      timestamp: Date.now(),
    });
  }
  setClientState(ws, { room: null });
}

// ─── Handler: exit_chat (silent disconnect) ───────────
// Called when user navigates back to dashboard without leaving the group.
// Removes them from the room without broadcasting a "user_left" system message.
export function handleExitChat(ws: WebSocket): void {
  const client = getClientState(ws);
  if (!client?.room) return;

  const room = getRoom(client.room);
  if (room) {
    room.clients.delete(ws);
  }
  // Clear room from client state so onclose doesn't fire user_left again
  setClientState(ws, { room: null });
}

// ─── Handler: ping ────────────────────────────────────
export function handlePing(ws: WebSocket): void {
  sendToClient(ws, { type: 'pong' });
}

// ─── Main dispatcher ──────────────────────────────────
export async function dispatchMessage(ws: WebSocket, raw: Buffer | string): Promise<void> {
  let payload: IncomingPayload;
  try {
    payload = JSON.parse(raw.toString()) as IncomingPayload;
  } catch {
    return;
  }

  switch (payload.type) {
    case 'join':
      await handleJoin(ws, payload as JoinPayload);
      break;
    case 'leave_group':
      handleLeaveGroup(ws);
      break;
    case 'exit_chat':
      handleExitChat(ws);
      break;
    case 'message':
      await handleMessage(ws, payload as MessagePayload);
      break;
    case 'reaction':
      handleReaction(ws, payload as ReactionPayload);
      break;
    case 'typing':
      handleTyping(ws, payload as TypingPayload);
      break;
    case 'ping':
      handlePing(ws);
      break;
  }
}
