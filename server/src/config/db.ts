import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the MONGO_URI from .env.
 * Falls back to in-memory mode if the connection fails (dev convenience).
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/pulse-chat';

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${uri}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', (err as Error).message);
    console.warn('⚠  Running WITHOUT database persistence (in-memory only).');
  }
}
