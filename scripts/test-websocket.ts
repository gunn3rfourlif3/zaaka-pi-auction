import { io } from "socket.io-client";

// Connect to the WebSocket server
const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling']
});

console.log("🚀 Testing WebSocket connection...");

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server with ID:", socket.id);
  
  // Simulate joining an auction room (although we broadcast globally now)
  const testAuctionId = 123;
  console.log(`🔌 Joining auction room for ID: ${testAuctionId}`);
  socket.emit("join_auction", testAuctionId);
});

socket.on("bid_update", (data) => {
  console.log("🔔 RECEIVED BID UPDATE:", data);
});

socket.on("auction_finalized", (data) => {
  console.log("🏁 RECEIVED AUCTION FINALIZED:", data);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection Error:", err.message);
});

// Keep the script running
setInterval(() => {}, 1000);
