import mongoose, { Schema, Document } from 'mongoose';

// ─── ReplyReference subdocument ───────────────────────
export interface IReplyReference {
  id: string;
  senderName: string;
  text: string;
}

// ─── Message document interface ───────────────────────
export interface IMessage extends Document {
  msgId: string;
  room: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  replyTo?: IReplyReference;
  mediaType?: 'image' | 'file';
  mediaData?: string;
  fileName?: string;
  fileSize?: number;
}

const ReplyReferenceSchema = new Schema<IReplyReference>(
  {
    id: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, default: '' },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>({
  msgId: { type: String, required: true, index: true },
  room: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, default: '' },
  timestamp: { type: Number, required: true },
  replyTo: { type: ReplyReferenceSchema, default: undefined },
  mediaType: { type: String, enum: ['image', 'file'], default: undefined },
  mediaData: { type: String, default: undefined },
  fileName: { type: String, default: undefined },
  fileSize: { type: Number, default: undefined },
});

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
