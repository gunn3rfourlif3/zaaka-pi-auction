// Custom production server: Next.js (pages + API routes) + Socket.IO real-time.
//
// This is the production entry point (see `npm start` / PM2 ecosystem file).
// It serves the whole Next app via Next's request handler AND hosts the
// Socket.IO server plus the /api/emit-bid-update endpoint that the bid flow
// calls to broadcast live updates.
//
// Configuration is entirely env-driven — no hardcoded paths or domains:
//   PORT             port to listen on (default 3000)
//   HOST             bind address (default 127.0.0.1 — Nginx proxies to it)
//   ALLOWED_ORIGINS  comma-separated site origins allowed for Socket.IO CORS
//   NODE_ENV         "production" on the VPS

const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

// Pi Network origins the embedded app connects from, plus your own site
// origin(s) supplied via ALLOWED_ORIGINS (e.g. "https://auction.example.com").
const PI_ORIGINS = [
  'https://sandbox.minepi.com',
  'https://app-cdn.minepi.com',
  'https://app.minepi.com',
];
const siteOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...siteOrigins, ...PI_ORIGINS];

const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Expose io to API routes (used by the settlement service, etc.).
  global.io = io;

  io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    socket.on('join_auction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
      socket.emit('joined_auction', { auctionId, status: 'success' });
    });

    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction_${auctionId}`);
    });

    // Join a per-user room so the server can push notifications to this user.
    socket.on('join_user', (username) => {
      if (username) socket.join(`user_${username}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Client disconnected:', socket.id, 'Reason:', reason);
    });
  });

  // --- Custom real-time endpoints (must be registered BEFORE the Next handler) ---
  app.post('/api/emit-bid-update', (req, res) => {
    try {
      const { auctionId, newBid, bidder } = req.body || {};
      if (!auctionId || !newBid) return res.status(400).json({ error: 'Missing fields' });
      io.to(`auction_${auctionId}`).emit('bid_update', {
        auctionId: parseInt(auctionId, 10),
        newBid: parseFloat(newBid),
        bidder,
        timestamp: Date.now(),
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', socketIO: true, timestamp: Date.now() });
  });

  // --- Everything else (pages + all other API routes) is handled by Next.js ---
  app.all('*', (req, res) => handle(req, res));

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Pi Auctions server live on http://${HOST}:${PORT} (dev=${dev})`);
  });
});
