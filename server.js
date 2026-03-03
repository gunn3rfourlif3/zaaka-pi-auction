const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const PORT = 5500;

nextApp.prepare().then(() => {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: ["*", "https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev"],
            methods: ["GET", "POST"],
            credentials: true
        },
        serveClient: true, // Enable serving Socket.IO client
        allowEIO3: true // Allow Engine.IO v3 for better compatibility
    });

    // Make io accessible to our API routes
    global.io = io;

    io.on('connection', (socket) => {
        console.log('🟢 Client connected:', socket.id);
        console.log('   Origin:', socket.handshake.headers.origin);
        console.log('   User-Agent:', socket.handshake.headers['user-agent']);

        socket.on('join_auction', (auctionId) => {
            socket.join(`auction_${auctionId}`);
            console.log(`📡 Socket ${socket.id} joined auction_${auctionId}`);
        });

        socket.on('leave_auction', (auctionId) => {
            socket.leave(`auction_${auctionId}`);
            console.log(`📡 Socket ${socket.id} left auction_${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log('🔴 Client disconnected:', socket.id);
        });
    });

    // Add event emitter for bid updates
    app.post('/api/emit-bid-update', (req, res) => {
        const { auctionId, newBid, bidder } = req.body;
        
        console.log(`🎯 Server emitting bid_update: Auction ${auctionId}, Bid ${newBid} by ${bidder}`);
        
        // Emit to all connected clients (global broadcast)
        io.emit('bid_update', { auctionId, newBid, bidder });
        
        // Also emit to specific auction room
        io.to(`auction_${auctionId}`).emit('bid_update', { auctionId, newBid, bidder });
        
        res.json({ success: true, message: 'Bid update emitted' });
    });

    // Add event emitter for auction finalization
    app.post('/api/emit-auction-finalized', (req, res) => {
        const { auctionId, finalPrice, winnerId, status } = req.body;
        
        console.log(`🏁 Server emitting auction_finalized: Auction ${auctionId} won by ${winnerId} for ${finalPrice}`);
        
        io.emit('auction_finalized', { auctionId, finalPrice, winnerId, status });
        io.to(`auction_${auctionId}`).emit('auction_finalized', { auctionId, finalPrice, winnerId, status });
        
        res.json({ success: true, message: 'Auction finalized emitted' });
    });

    // Serve Socket.IO client before other routes
    app.get('/socket.io/socket.io.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'));
    });

    // This middleware adds the skip-warning header to EVERY request
    app.use((req, res, next) => {
        res.setHeader('ngrok-skip-browser-warning', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://sandbox.minepi.com https://app-cdn.minepi.com https://*.minepi.com; img-src * data: blob:; font-src * data:; script-src * 'unsafe-inline' 'unsafe-eval' https://sdk.minepi.com https://app-cdn.minepi.com; connect-src * https://app-cdn.minepi.com ws: wss:;");
        next();
    });

    // Handle all other requests with Next.js
    app.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`
        ✅ Server is running on http://localhost:${PORT}
        WebSocket enabled 🟢
        `);
    });
});
