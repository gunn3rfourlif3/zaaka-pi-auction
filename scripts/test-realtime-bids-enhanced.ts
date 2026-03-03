import { io } from "socket.io-client";

// Enhanced test script to simulate real bid scenarios
const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling']
});

console.log("🧪 Enhanced Real-Time Bid Testing...");

let testResults = {
    connection: false,
    bidUpdates: [],
    errors: []
};

socket.on("connect", () => {
    console.log("✅ Connected to WebSocket server with ID:", socket.id);
    testResults.connection = true;
    
    // Join a specific auction for testing
    const testAuctionId = 123;
    console.log(`🔌 Joining auction room for ID: ${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    console.log("\n📋 Ready for testing! Please:");
    console.log("1. Open the web app in two browsers");
    console.log("2. Log in as different mock users");
    console.log("3. Navigate to the same auction item");
    console.log("4. Place bids and watch this console for updates\n");
});

socket.on("bid_update", (data) => {
    const timestamp = new Date().toISOString();
    console.log("🔔 BID UPDATE RECEIVED:");
    console.log("  📊 Auction ID:", data.auctionId);
    console.log("  💰 New Bid Amount:", data.newBid, "π");
    console.log("  👤 Bidder:", data.bidder);
    console.log("  ⏰ Timestamp:", timestamp);
    console.log("  ✅ Update processed successfully!");
    console.log("");
    
    testResults.bidUpdates.push({
        ...data,
        receivedAt: timestamp
    });
});

socket.on("auction_finalized", (data) => {
    console.log("🏁 AUCTION FINALIZED:");
    console.log("  🎯 Auction ID:", data.auctionId);
    console.log("  💎 Final Price:", data.finalPrice, "π");
    console.log("  🏆 Winner ID:", data.winnerId);
    console.log("  📊 Status:", data.status);
    console.log("");
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
    testResults.errors.push({
        type: 'connection',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

socket.on("disconnect", () => {
    console.log("🔌 Disconnected from server");
    console.log("\n📊 Test Summary:");
    console.log("  Connection Status:", testResults.connection ? "✅ Connected" : "❌ Failed");
    console.log("  Bid Updates Received:", testResults.bidUpdates.length);
    console.log("  Errors:", testResults.errors.length);
    
    if (testResults.bidUpdates.length > 0) {
        console.log("\n🎯 Last Bid Update Details:");
        const lastUpdate = testResults.bidUpdates[testResults.bidUpdates.length - 1];
        console.log("  Auction ID:", lastUpdate.auctionId);
        console.log("  Amount:", lastUpdate.newBid, "π");
        console.log("  Bidder:", lastUpdate.bidder);
    }
});

// Enhanced logging for debugging
socket.onAny((event, ...args) => {
    if (event !== 'bid_update' && event !== 'auction_finalized' && event !== 'connect' && event !== 'disconnect') {
        console.log(`📡 Received event: ${event}`, args);
    }
});

// Keep the script running
console.log("\n⏳ Monitoring for real-time events... Press Ctrl+C to stop\n");
setInterval(() => {}, 1000);