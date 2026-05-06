import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MessageModel } from '../models/Message.model';
import { RoomModel } from '../models/Room.model';

const router = Router();

/**
 * GET /api/rooms/:roomId/messages?limit=50
 * Fetch paginated message history for a room (REST fallback)
 */
router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  if (mongoose.connection.readyState !== 1) {
    res.json({ messages: [], warning: 'Database not connected' });
    return;
  }

  try {
    const messages = await MessageModel.find({ room: roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/rooms
 * List all persisted rooms
 */
router.get('/rooms', async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    res.json({ rooms: [], warning: 'Database not connected' });
    return;
  }

  try {
    const rooms = await RoomModel.find({}, { roomId: 1, type: 1, createdAt: 1, _id: 0 }).lean();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

export default router;
