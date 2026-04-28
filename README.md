# Pulse — MERN Chat App (TypeScript)

A full-stack real-time chat application built with the **MERN** stack and **TypeScript**.

## Tech Stack
| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | React 18 + Vite + TypeScript          |
| Backend    | Node.js + Express + TypeScript        |
| Database   | MongoDB (via Mongoose)                |
| Realtime   | Native WebSockets (`ws` library)      |
| Styling    | CSS Modules with design tokens        |

---

## Project Structure

```
pulse-mern/
├── server/                     # Express + WS backend
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── config/
│   │   │   └── db.ts           # MongoDB connection
│   │   ├── models/
│   │   │   ├── Message.model.ts
│   │   │   └── Room.model.ts
│   │   ├── services/
│   │   │   └── roomManager.ts  # In-memory + DB state
│   │   ├── handlers/
│   │   │   └── wsHandlers.ts   # WS event dispatcher
│   │   ├── routes/
│   │   │   └── api.routes.ts   # REST API endpoints
│   │   ├── types/
│   │   │   └── ws.types.ts     # Shared TypeScript types
│   │   └── utils/
│   │       └── helpers.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── client/                     # React + Vite frontend
    ├── src/
    │   ├── main.tsx            # Entry point
    │   ├── App.tsx             # Root component
    │   ├── index.css           # Global tokens
    │   ├── types/
    │   │   └── chat.types.ts
    │   ├── utils/
    │   │   └── helpers.ts
    │   ├── hooks/
    │   │   ├── useChat.ts      # WebSocket + state
    │   │   ├── useTyping.ts
    │   │   ├── useScrollManager.ts
    │   │   └── useToast.ts
    │   └── components/
    │       ├── JoinScreen/
    │       ├── ChatScreen/
    │       ├── ChatHeader/
    │       ├── MessageBubble/
    │       ├── MessageInput/
    │       ├── UsersPanel/
    │       ├── TypingIndicator/
    │       ├── DropOverlay/
    │       ├── Lightbox/
    │       └── ToastContainer/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Install dependencies

```bash
# From pulse-mern root
npm run install:all
# OR manually:
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pulse-chat
CLIENT_URL=http://localhost:5173
```

### 3. Run development servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

> **Note:** The server falls back gracefully to in-memory-only mode if MongoDB is not running.

---

## Features

- **Real-time messaging** via WebSocket
- **Typing indicators** (debounced)
- **Emoji reactions** — hover any message → react
- **Message replies** — threaded reply preview with scroll-to-original
- **Image sharing** — inline preview + lightbox
- **File sharing** — PDF, docs, etc. with download link
- **Drag & drop** upload directly into chat
- **Public & private rooms** — password protected
- **Dark / Light mode** toggle
- **User list panel** with avatars
- **Message history** persisted to MongoDB
- **Auto-reconnect** with exponential backoff
- **REST API** for message history (`GET /api/rooms/:id/messages`)

---

## File Size Limits
- Images: 5 MB max
- Other files: 10 MB max

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health + DB status |
| GET | `/api/rooms` | List all persisted rooms |
| GET | `/api/rooms/:roomId/messages` | Fetch message history |
