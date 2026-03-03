import { io } from "socket.io-client";

// Diagnostic script to identify WebSocket issues
console.log("🔍 DIAGNOSTIC: Testing WebSocket Connection...");

// Test 1: Direct connection to server
const socket = io("http://localhost:5500", {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true // Force new connection for testing
});

let diagnostics = {
    connection: false,
    socketId: null,
    eventsReceived: [],
    errors: [],
    connectionAttempts: 0
};

// Monitor all events
socket.onAny((event, ...args) => {
    console.log(`📡 Event: ${event}`, args);
    diagnostics.eventsReceived.push({ event, data: args, timestamp: new Date().toISOString() });
});

socket.on("connect", () => {
    console.log("✅ Connected! Socket ID:", socket.id);
    diagnostics.connection = true;
    diagnostics.socketId = socket.id;
    
    // Test joining an auction room
    console.log("🔌 Testing auction room join...");
    socket.emit("join_auction", 123);
    
    // Test emitting a bid_update manually to see if it works
    setTimeout(() => {
        console.log("🧪 Manually testing bid_update event...");
        socket.emit("test_bid", { auctionId: 123, newBid: 50, bidder: "tester" });
    }, 2000);
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
    diagnostics.errors.push({ type: 'connection', message: err.message });
});

socket.on("error", (err) => {
    console.error("❌ Socket Error:", err);
    diagnostics.errors.push({ type: 'socket', message: err.message || err });
});

socket.on("disconnect", (reason) => {
    console.log("🔌 Disconnected:", reason);
    diagnostics.connection = false;
});

// Test 2: Check if browser's Socket.IO is working
setTimeout(() => {
    console.log("\n🔍 DIAGNOSTIC SUMMARY:");
    console.log("Connection Status:", diagnostics.connection ? "✅ Connected" : "❌ Failed");
    console.log("Socket ID:", diagnostics.socketId || "❌ None");
    console.log("Events Received:", diagnostics.eventsReceived.length);
    console.log("Errors:", diagnostics.errors.length);
    
    if (diagnostics.eventsReceived.length > 0) {
        console.log("\n📊 Events Log:");
        diagnostics.eventsReceived.forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.event} - ${event.timestamp}`);
        });
    }
    
    if (diagnostics.errors.length > 0) {
        console.log("\n❌ Error Log:");
        diagnostics.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.type}: ${error.message}`);
        });
    }
    
    console.log("\n🔍 Browser Socket.IO Check:");
    console.log("window.io available:", typeof (global as any).window !== 'undefined' && (global as any).window.io ? "✅ Yes" : "❌ No");
    
    process.exit(0);
}, 10000);

console.log("⏳ Monitoring for 10 seconds...\n");