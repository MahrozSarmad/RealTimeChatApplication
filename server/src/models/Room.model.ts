import mongoose, { Schema, Document } from 'mongoose';

// ─── Room document interface ───────────────────────────
export interface IRoom extends Document {
  roomId: string;
  type: 'public' | 'private';
  passwordHash: string | null;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  passwordHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const RoomModel = mongoose.model<IRoom>('Room', RoomSchema);
