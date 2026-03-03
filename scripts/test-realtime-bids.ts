import { io } from "socket.io-client";

// Test script to verify real-time bid updates
const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling']
});

console.log("🧪 Testing Real-Time Bid Updates...");

socket.on("connect", () => {
    console.log("✅ Connected to WebSocket server with ID:", socket.id);
    
    // Test 1: Listen for bid updates
    socket.on("bid_update", (data) => {
        console.log("🔔 BID UPDATE RECEIVED:");
        console.log("  Auction ID:", data.auctionId);
        console.log("  New Bid Amount:", data.newBid);
        console.log("  Bidder:", data.bidder);
        console.log("  Timestamp:", new Date().toISOString());
        console.log("");
    });

    // Test 2: Listen for auction finalization
    socket.on("auction_finalized", (data) => {
        console.log("🏁 AUCTION FINALIZED:");
        console.log("  Auction ID:", data.auctionId);
        console.log("  Final Price:", data.finalPrice);
        console.log("  Winner ID:", data.winnerId);
        console.log("  Status:", data.status);
        console.log("");
    });

    // Test 3: Simulate joining an auction room
    const testAuctionId = 123;
    console.log(`🔌 Joining auction room for ID: ${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    console.log("\n📝 Ready to receive real-time updates!");
    console.log("💡 Open the web app in two browsers and place bids to test.");
    console.log("💡 You should see bid updates appear here instantly.\n");
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
});

socket.on("disconnect", () => {
    console.log("🔌 Disconnected from server");
});

// Keep the script running
setInterval(() => {}, 1000);