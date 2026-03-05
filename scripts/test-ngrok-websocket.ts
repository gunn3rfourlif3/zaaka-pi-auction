import { io } from "socket.io-client";

// Comprehensive test for ngrok-compatible WebSocket system
console.log("🔧 NGROK-COMPATIBLE WEBSOCKET TEST");
console.log("=====================================");

// Determine the correct connection URL based on environment
const isLocalhost = !window || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const serverUrl = isLocalhost ? 'http://localhost:5500' : undefined; // Use current host for ngrok

console.log("🌐 Environment:", isLocalhost ? "Localhost" : "Ngrok/Remote");
console.log("🔗 Server URL:", serverUrl || "Current Host");

const socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 15000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    // Add extra headers for ngrok compatibility
    extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
    }
});

let testResults = {
    connection: false,
    bidUpdates: [],
    errors: [],
    socketId: null,
    connectionAttempts: 0
};

// Enhanced connection logging
socket.on("connect", () => {
    console.log("✅ WebSocket Connection: SUCCESS");
    console.log("   Socket ID:", socket.id);
    console.log("   Transport:", socket.io.engine.transport.name);
    console.log("   Connected to:", "WebSocket server");
    
    testResults.connection = true;
    testResults.socketId = socket.id;
    
    // Test joining an auction room
    const testAuctionId = 1;
    console.log(`\n🔌 Testing auction room join for ID: ${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    console.log("\n🎯 Listening for bid_update events...");
    console.log("💡 Place a bid in the web app to test real-time updates");
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
    console.error("   Type:", (err as any).type || 'unknown');
    console.error("   Context:", (err as any).context);
    testResults.errors.push({
        type: 'connection',
        message: err.message,
        context: (err as any).context,
        timestamp: new Date().toISOString()
    });
    testResults.connectionAttempts++;
});

socket.on("error", (err) => {
    console.error("❌ Socket Error:", err);
    testResults.errors.push({
        type: 'socket',
        message: err.message || err,
        timestamp: new Date().toISOString()
    });
});

socket.on("disconnect", (reason) => {
    console.log("🔌 Disconnected:", reason);
    testResults.connection = false;
});

// Bid update events
socket.on("bid_update", (data) => {
    const timestamp = new Date().toISOString();
    console.log("\n🚨 BID UPDATE RECEIVED!");
    console.log("   Auction ID:", data.auctionId);
    console.log("   New Bid Amount:", data.newBid, "π");
    console.log("   Bidder:", data.bidder);
    console.log("   Timestamp:", timestamp);
    
    testResults.bidUpdates.push({
        ...data,
        receivedAt: timestamp
    });
    
    console.log("\n🎉 SUCCESS: Real-time bid updates are working!");
    console.log("   The system is fully operational.");
});

// Auction finalization
socket.on("auction_finalized", (data) => {
    console.log("\n🏁 AUCTION FINALIZED!");
    console.log("   Auction ID:", data.auctionId);
    console.log("   Final Price:", data.finalPrice, "π");
    console.log("   Winner ID:", data.winnerId);
});

// Monitor all events for debugging
socket.onAny((event, ...args) => {
    if (!['connect', 'disconnect', 'bid_update', 'auction_finalized'].includes(event)) {
        console.log(`📡 Event: ${event}`, args);
    }
});

// Final summary after disconnection
setTimeout(() => {
    console.log("\n📊 FINAL TEST SUMMARY");
    console.log("======================");
    console.log("Environment:", isLocalhost ? "Localhost" : "Ngrok/Remote");
    console.log("Connection Status:", testResults.connection ? "✅ CONNECTED" : "❌ FAILED");
    console.log("Socket ID:", testResults.socketId || "❌ None");
    console.log("Bid Updates Received:", testResults.bidUpdates.length);
    console.log("Connection Attempts:", testResults.connectionAttempts);
    console.log("Errors:", testResults.errors.length);
    
    if (testResults.bidUpdates.length > 0) {
        console.log("\n🎯 Last Bid Update:");
        const last = testResults.bidUpdates[testResults.bidUpdates.length - 1];
        console.log("   Auction ID:", last.auctionId);
        console.log("   Amount:", last.newBid, "π");
        console.log("   Bidder:", last.bidder);
    }
    
    if (testResults.errors.length > 0) {
        console.log("\n❌ Errors:");
        testResults.errors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.type}: ${err.message}`);
        });
    }
    
    console.log("\n🧪 READY FOR MANUAL TESTING");
    console.log("============================");
    console.log("1. Open the web app in two browsers");
    console.log("2. Log in as different mock users");
    console.log("3. Navigate to the same auction item");
    console.log("4. Place a bid and watch this console");
    console.log("5. ✅ You should see bid updates appear instantly!");
    
    console.log("\n🔧 Troubleshooting:");
    console.log("- If connection fails, check browser console for CORS errors");
    console.log("- Ensure server is running on port 5500");
    console.log("- Check firewall/proxy settings");
    console.log("- For ngrok: ensure tunnel is active");
}, 30000); // Show summary after 30 seconds

console.log("\n⏳ Monitoring for events... Press Ctrl+C to stop\n");
console.log("💡 The system is ready for testing!\n");

// Keep the script running
setInterval(() => {}, 1000);