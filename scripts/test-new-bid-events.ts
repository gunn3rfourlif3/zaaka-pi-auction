import { io } from "socket.io-client";

// Test the new bid event emission system
const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling']
});

console.log("🧪 Testing NEW bid event emission system...");

socket.on("connect", () => {
    console.log("✅ Connected! Socket ID:", socket.id);
    
    // Listen for bid_update events
    socket.on("bid_update", (data) => {
        console.log("🎯 BID_UPDATE EVENT RECEIVED!");
        console.log("  Auction ID:", data.auctionId);
        console.log("  New Bid:", data.newBid);
        console.log("  Bidder:", data.bidder);
        console.log("  Timestamp:", new Date().toISOString());
        console.log("");
    });
    
    // Join an auction room
    const testAuctionId = 1;
    console.log(`🔌 Joining auction room: auction_${testAuctionId}`);
    socket.emit("join_auction", testAuctionId);
    
    console.log("\n📝 Waiting for bid events...");
    console.log("💡 Now place a bid in the web app and watch this console.");
    console.log("💡 The server should now emit bid_update events!\n");
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
});

socket.on("disconnect", () => {
    console.log("🔌 Disconnected from server");
});

// Keep monitoring
setInterval(() => {}, 1000);