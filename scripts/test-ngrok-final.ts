import { io } from "socket.io-client";

// Comprehensive ngrok-compatible WebSocket test with HTTP polling fallback
console.log("🔧 NGROK-COMPATIBLE WEBSOCKET TEST");
console.log("=====================================");

// Determine the correct connection strategy based on environment
const isLocalhost = !window || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isNgrok = window && window.location.hostname.includes('ngrok');

console.log("🌐 Environment:", isLocalhost ? "Localhost" : isNgrok ? "Ngrok" : "Remote");

// Ngrok-compatible connection configuration
const connectionConfig = {
    transports: isNgrok ? ['polling'] : ['websocket', 'polling'], // Force polling for ngrok
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    // Add extra headers for ngrok compatibility
    extraHeaders: isNgrok ? {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    } : {}
};

// Determine server URL
let serverUrl;
if (isLocalhost) {
    serverUrl = 'http://localhost:5500';
} else if (isNgrok) {
    // Use the current ngrok URL for polling
    serverUrl = undefined; // Let Socket.IO use current origin
} else {
    serverUrl = undefined; // Use current origin
}

console.log("🔗 Server URL:", serverUrl || window.location.origin);
console.log("📡 Transports:", connectionConfig.transports.join(', '));

const socket = io(serverUrl, connectionConfig);

let testResults = {
    connection: false,
    socketId: null,
    bidUpdates: [],
    errors: [],
    connectionAttempts: 0,
    transportUsed: null
};

// Enhanced connection logging with detailed information
socket.on("connect", () => {
    console.log("✅ WebSocket Connection: SUCCESS");
    console.log("   Socket ID:", socket.id);
    console.log("   Transport:", socket.io.engine.transport.name);
    console.log("   Connected to:", socket.io.uri || window.location.origin);
    console.log("   Environment:", isNgrok ? "Ngrok (HTTP Polling)" : "Localhost/WebSocket");
    
    testResults.connection = true;
    testResults.socketId = socket.id;
    testResults.transportUsed = socket.io.engine.transport.name;
    
    // Test joining an auction room
    const testAuctionId = 1;
    console.log(`\n🔌 Testing auction room join for ID: ${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    console.log("\n🎯 Listening for bid_update events...");
    console.log("💡 Place a bid in the web app to test real-time updates");
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
    console.error("   Type:", err.type);
    console.error("   Transport:", socket.io.engine.transport.name);
    console.error("   Context:", err.context || 'No additional context');
    
    testResults.errors.push({
        type: 'connection',
        message: err.message,
        context: err.context,
        transport: socket.io.engine.transport.name,
        timestamp: new Date().toISOString()
    });
    testResults.connectionAttempts++;
    
    console.log("\n🔧 Troubleshooting Tips:");
    console.log("   1. Check if ngrok tunnel is active");
    console.log("   2. Verify server is running on port 5500");
    console.log("   3. Check firewall/proxy settings");
    console.log("   4. Try refreshing the page");
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
    console.log("   Transport:", socket.io.engine.transport.name);
    
    testResults.bidUpdates.push({
        ...data,
        receivedAt: timestamp,
        transport: socket.io.engine.transport.name
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

// Final summary after timeout
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("📊 FINAL TEST SUMMARY");
    console.log("=".repeat(50));
    console.log("Environment:", isLocalhost ? "Localhost" : isNgrok ? "Ngrok" : "Remote");
    console.log("Connection Status:", testResults.connection ? "✅ CONNECTED" : "❌ FAILED");
    console.log("Socket ID:", testResults.socketId || "❌ None");
    console.log("Transport Used:", testResults.transportUsed || "❌ None");
    console.log("Bid Updates Received:", testResults.bidUpdates.length);
    console.log("Connection Attempts:", testResults.connectionAttempts);
    console.log("Errors:", testResults.errors.length);
    
    if (testResults.bidUpdates.length > 0) {
        console.log("\n🎯 Last Bid Update:");
        const last = testResults.bidUpdates[testResults.bidUpdates.length - 1];
        console.log("   Auction ID:", last.auctionId);
        console.log("   Amount:", last.newBid, "π");
        console.log("   Bidder:", last.bidder);
        console.log("   Transport:", last.transport);
    }
    
    if (testResults.errors.length > 0) {
        console.log("\n❌ Errors:");
        testResults.errors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.type}: ${err.message}`);
            if (err.transport) console.log(`      Transport: ${err.transport}`);
        });
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("🧪 READY FOR MANUAL TESTING");
    console.log("=".repeat(50));
    console.log("1. Open the web app in two browsers");
    console.log("2. Log in as different mock users");
    console.log("3. Navigate to the same auction item");
    console.log("4. Place a bid and watch this console");
    console.log("5. ✅ You should see bid updates appear instantly!");
    
    if (isNgrok) {
        console.log("\n🔧 Ngrok-Specific Notes:");
        console.log("   - Using HTTP polling instead of WebSocket");
        console.log("   - Updates may have slight delay (1-3 seconds)");
        console.log("   - This is expected behavior for ngrok free tier");
    }
    
    console.log("\n🔧 General Troubleshooting:");
    console.log("   - Check if ngrok tunnel is active");
    console.log("   - Verify server is running on port 5500");
    console.log("   - Check browser console for detailed errors");
    console.log("   - Try refreshing the page");
    console.log("   - Ensure firewall allows connections");
}, 30000); // Show summary after 30 seconds

console.log("\n⏳ Monitoring for events... Press Ctrl+C to stop\n");
console.log("💡 The system is ready for testing!\n");

// Keep the script running
setInterval(() => {}, 1000);