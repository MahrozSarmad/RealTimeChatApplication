import 'dotenv/config';
import http from 'http';
import os from 'os';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';

import { connectDB } from './config/db';
import apiRoutes from './routes/api.routes';
import { dispatchMessage } from './handlers/wsHandlers';
import {
  registerClient,
  removeClient,
  getClientState,
  getRoom,
  getRoomUserList,
  broadcastToRoom,
  sendToClient,
} from './services/roomManager';
import { generateId } from './utils/helpers';

const PORT = parseInt(process.env.PORT ?? '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

// ─── Express App ──────────────────────────────────────
const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '14mb' }));
app.use('/api', apiRoutes);

// ─── HTTP Server ──────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket Server ─────────────────────────────────
const wss = new WebSocketServer({ server, maxPayload: 12 * 1024 * 1024 });

wss.on('connection', (ws: WebSocket) => {
  const clientId = generateId();
  registerClient(ws, clientId);
  sendToClient(ws, { type: 'connected', id: clientId });

  ws.on('message', async (raw) => {
    // Guard against oversized payloads (WS maxPayload already handles this, but just in case)
    if (Buffer.isBuffer(raw) && raw.length > 12 * 1024 * 1024) return;
    await dispatchMessage(ws, raw as Buffer);
  });

  ws.on('close', () => {
    const client = removeClient(ws);
    if (client?.room) {
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
    }
  });

  ws.on('error', () => {
    try { ws.terminate(); } catch { /* ignore */ }
  });
});

// ─── Boot ──────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();

  server.listen(PORT, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of (nets[name] ?? [])) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
          break;
        }
      }
    }

    console.log(`\n✅ Pulse Chat server running!`);
    console.log(`\n   API:     http://localhost:${PORT}/api`);
    console.log(`   WS:      ws://localhost:${PORT}`);
    console.log(`   Network: http://${localIp}:${PORT}`);
    console.log(`\n   Client:  ${CLIENT_URL}\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
