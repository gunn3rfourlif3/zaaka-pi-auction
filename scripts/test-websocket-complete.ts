import { io } from "socket.io-client";

// Comprehensive test for the fixed WebSocket system
console.log("🔧 COMPREHENSIVE WEBSOCKET TEST");
console.log("=====================================");

const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: true
});

let testResults = {
    connection: false,
    bidUpdates: [],
    errors: [],
    socketId: null
};

// Test 1: Connection
socket.on("connect", () => {
    console.log("✅ WebSocket Connection: SUCCESS");
    console.log("   Socket ID:", socket.id);
    testResults.connection = true;
    testResults.socketId = socket.id;
    
    // Test 2: Join auction room
    const testAuctionId = 1;
    console.log(`\n🔌 Testing auction room join for ID: ${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    // Test 3: Listen for bid updates
    console.log("\n🎯 Listening for bid_update events...");
});

// Test 4: Bid update events
socket.on("bid_update", (data) => {
    const timestamp = new Date().toISOString();
    console.log("🚨 BID UPDATE RECEIVED!");
    console.log("   Auction ID:", data.auctionId);
    console.log("   New Bid Amount:", data.newBid, "π");
    console.log("   Bidder:", data.bidder);
    console.log("   Timestamp:", timestamp);
    
    testResults.bidUpdates.push({
        ...data,
        receivedAt: timestamp
    });
    
    console.log("\n🎉 SUCCESS: Real-time bid updates are working!");
    console.log("   The system is now fully operational.");
});

// Test 5: Auction finalization
socket.on("auction_finalized", (data) => {
    console.log("\n🏁 AUCTION FINALIZED!");
    console.log("   Auction ID:", data.auctionId);
    console.log("   Final Price:", data.finalPrice, "π");
    console.log("   Winner ID:", data.winnerId);
});

// Error handling
socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
    testResults.errors.push({
        type: 'connection',
        message: err.message,
        timestamp: new Date().toISOString()
    });
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
    console.log("\n🔌 Disconnected:", reason);
    
    // Final summary
    console.log("\n📊 FINAL TEST SUMMARY");
    console.log("======================");
    console.log("Connection Status:", testResults.connection ? "✅ CONNECTED" : "❌ FAILED");
    console.log("Socket ID:", testResults.socketId || "❌ None");
    console.log("Bid Updates Received:", testResults.bidUpdates.length);
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
});

// Monitor all events for debugging
socket.onAny((event, ...args) => {
    if (!['connect', 'disconnect', 'bid_update', 'auction_finalized'].includes(event)) {
        console.log(`📡 Event: ${event}`, args);
    }
});

console.log("\n⏳ Monitoring for events... Press Ctrl+C to stop\n");
console.log("💡 The system is ready for testing!\n");

// Keep the script running
setInterval(() => {}, 1000);