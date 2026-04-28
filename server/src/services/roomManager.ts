import { WebSocket } from 'ws';
import {
  RoomState,
  ClientState,
  UserInfo,
  ChatMessage,
  ReactionMap,
} from '../types/ws.types';
import { MessageModel } from '../models/Message.model';
import { RoomModel } from '../models/Room.model';
import { hashPassword, sanitize } from '../utils/helpers';
import mongoose from 'mongoose';

// ─── In-memory stores ─────────────────────────────────
const rooms = new Map<string, RoomState>();
const clients = new Map<WebSocket, ClientState>();

// ─── Client helpers ────────────────────────────────────
export function registerClient(ws: WebSocket, id: string): void {
  clients.set(ws, { id, name: null, room: null });
}

export function removeClient(ws: WebSocket): ClientState | undefined {
  const state = clients.get(ws);
  clients.delete(ws);
  return state;
}

export function getClientState(ws: WebSocket): ClientState | undefined {
  return clients.get(ws);
}

export function setClientState(ws: WebSocket, patch: Partial<ClientState>): void {
  const existing = clients.get(ws);
  if (existing) clients.set(ws, { ...existing, ...patch });
}

// ─── Room helpers ──────────────────────────────────────
export function getOrCreateRoom(
  roomId: string,
  type: 'public' | 'private' = 'public',
  passwordHash: string | null = null
): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      messages: [],
      clients: new Set(),
      type,
      passwordHash,
      reactions: {},
    });
  }
  return rooms.get(roomId)!;
}

export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function getRoomUserList(roomId: string): UserInfo[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.clients)
    .map((ws) => clients.get(ws))
    .filter((c): c is ClientState => Boolean(c) && c!.name !== null)
    .map((c) => ({ id: c.id, name: c.name! }));
}

// ─── Broadcast ────────────────────────────────────────
export function broadcastToRoom(
  roomId: string,
  data: object,
  excludeWs: WebSocket | null = null
): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(data);
  room.clients.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function sendToClient(ws: WebSocket, data: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ─── DB persistence helpers ────────────────────────────

/**
 * Persist a new room to MongoDB (upsert).
 */
export async function persistRoom(
  roomId: string,
  type: 'public' | 'private',
  passwordHash: string | null
): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await RoomModel.findOneAndUpdate(
      { roomId },
      { roomId, type, passwordHash },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[DB] Failed to persist room:', (err as Error).message);
  }
}

/**
 * Load a room's password hash from MongoDB.
 */
export async function loadRoomFromDB(
  roomId: string
): Promise<{ type: 'public' | 'private'; passwordHash: string | null } | null> {
  if (mongoose.connection.readyState !== 1) return null;
  try {
    const doc = await RoomModel.findOne({ roomId });
    if (!doc) return null;
    return { type: doc.type, passwordHash: doc.passwordHash };
  } catch {
    return null;
  }
}

/**
 * Persist a message to MongoDB.
 */
export async function persistMessage(msg: ChatMessage): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await MessageModel.create({
      msgId: msg.id,
      room: (msg as any)._room,  // injected at call site
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: msg.text,
      timestamp: msg.timestamp,
      replyTo: msg.replyTo,
      mediaType: msg.mediaType,
      mediaData: msg.mediaData,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
    });
  } catch (err) {
    console.error('[DB] Failed to persist message:', (err as Error).message);
  }
}

/**
 * Load last N messages for a room from MongoDB and seed the in-memory store.
 */
export async function loadRoomHistory(
  roomId: string,
  limit = 100
): Promise<ChatMessage[]> {
  if (mongoose.connection.readyState !== 1) return [];
  try {
    const docs = await MessageModel.find({ room: roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.reverse().map((d) => ({
      type: 'message' as const,
      id: d.msgId,
      senderId: d.senderId,
      senderName: d.senderName,
      text: d.text,
      timestamp: d.timestamp,
      replyTo: d.replyTo,
      mediaType: d.mediaType as 'image' | 'file' | undefined,
      mediaData: d.mediaData,
      fileName: d.fileName,
      fileSize: d.fileSize,
    }));
  } catch (err) {
    console.error('[DB] Failed to load history:', (err as Error).message);
    return [];
  }
}

// ─── Password validation ───────────────────────────────
export function validateRoomPassword(
  existingRoom: RoomState | undefined,
  password: string
): boolean {
  if (!existingRoom?.passwordHash) return true;
  if (!password) return false;
  return hashPassword(password) === existingRoom.passwordHash;
}

// ─── Reaction helpers ──────────────────────────────────
export function applyReaction(
  roomId: string,
  messageId: string,
  emoji: string,
  userId: string,
  action: 'add' | 'remove'
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  if (!room.reactions[messageId]) room.reactions[messageId] = {};
  if (!room.reactions[messageId][emoji]) room.reactions[messageId][emoji] = [];

  const users = room.reactions[messageId][emoji];
  const idx = users.indexOf(userId);

  if (action === 'add' && idx === -1) users.push(userId);
  if (action === 'remove' && idx !== -1) users.splice(idx, 1);
  if (users.length === 0) delete room.reactions[messageId][emoji];
}
