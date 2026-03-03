import { io } from "socket.io-client";
import { HttpPollingClient } from '../services/http-polling-client';

// Comprehensive test for the complete multi-layered ngrok-compatible system
console.log("🔧 COMPREHENSIVE NGROK-COMPATIBLE SYSTEM TEST");
console.log("=".repeat(60));

// Test configuration
const testAuctionId = 1;
const testBidAmount = 15.5;
const testBidder = "test_user";

// Determine environment
const isLocalhost = !window || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isNgrok = window && window.location.hostname.includes('ngrok');

console.log("🌐 Environment:", isLocalhost ? "Localhost" : isNgrok ? "Ngrok" : "Remote");
console.log("🎯 Test Auction ID:", testAuctionId);
console.log("💰 Test Bid Amount:", testBidAmount, "π");
console.log("👤 Test Bidder:", testBidder);

// Test results tracking
const testResults = {
    socketIO: { connected: false, transport: null, socketId: null, errors: [] },
    httpPolling: { connected: false, transport: null, clientId: null, errors: [] },
    bidUpdates: [],
    auctionFinalized: [],
    connectionOrder: []
};

// Test 1: Socket.IO Connection
async function testSocketIO() {
    console.log("\n" + "=".repeat(60));
    console.log("🔌 TEST 1: SOCKET.IO CONNECTION");
    console.log("=".repeat(60));
    
    return new Promise((resolve) => {
        try {
            const serverUrl = isLocalhost ? 'http://localhost:5500' : undefined;
            const socket = io(serverUrl, {
                transports: isNgrok ? ['polling'] : ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                reconnection: false, // Disable auto-reconnection for testing
                extraHeaders: isNgrok ? {
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                } : {}
            });

            socket.on('connect', () => {
                console.log("✅ Socket.IO Connected Successfully!");
                console.log("   Socket ID:", socket.id);
                console.log("   Transport:", socket.io.engine.transport.name);
                
                testResults.socketIO.connected = true;
                testResults.socketIO.socketId = socket.id;
                testResults.socketIO.transport = socket.io.engine.transport.name;
                testResults.connectionOrder.push('socketIO');
                
                // Join test auction
                socket.emit('join_auction', testAuctionId);
                console.log(`📡 Joined auction room: ${testAuctionId}`);
                
                // Set up listeners
                socket.on('bid_update', (data) => {
                    console.log("🎯 Socket.IO Bid Update Received:", data);
                    testResults.bidUpdates.push({ source: 'socketIO', data, timestamp: Date.now() });
                });
                
                socket.on('auction_finalized', (data) => {
                    console.log("🏁 Socket.IO Auction Finalized:", data);
                    testResults.auctionFinalized.push({ source: 'socketIO', data, timestamp: Date.now() });
                });
                
                setTimeout(() => {
                    socket.disconnect();
                    resolve(true);
                }, 5000);
            });

            socket.on('connect_error', (err) => {
                console.error("❌ Socket.IO Connection Error:", err.message);
                testResults.socketIO.errors.push(err.message);
                socket.disconnect();
                resolve(false);
            });

            socket.on('error', (err) => {
                console.error("❌ Socket.IO Error:", err);
                testResults.socketIO.errors.push(err.message || 'Unknown error');
            });

            // Timeout fallback
            setTimeout(() => {
                if (!testResults.socketIO.connected) {
                    console.log("⏱️  Socket.IO Connection Timeout");
                    socket.disconnect();
                    resolve(false);
                }
            }, 25000);

        } catch (error) {
            console.error("❌ Socket.IO Setup Error:", error);
            testResults.socketIO.errors.push(error.message);
            resolve(false);
        }
    });
}

// Test 2: HTTP Polling Connection
async function testHttpPolling() {
    console.log("\n" + "=".repeat(60));
    console.log("🔄 TEST 2: HTTP POLLING CONNECTION");
    console.log("=".repeat(60));
    
    try {
        const baseUrl = isLocalhost ? 'http://localhost:5500' : `${window.location.protocol}//${window.location.host}`;
        const clientId = `test_client_${Date.now()}`;
        
        console.log("🔗 Base URL:", baseUrl);
        console.log("👤 Client ID:", clientId);
        
        const httpClient = new HttpPollingClient(baseUrl, testAuctionId, clientId, 2000);
        
        // Set up event listeners
        httpClient.on('bid_update', (data) => {
            console.log("🎯 HTTP Polling Bid Update Received:", data);
            testResults.bidUpdates.push({ source: 'httpPolling', data, timestamp: Date.now() });
        });
        
        httpClient.on('auction_finalized', (data) => {
            console.log("🏁 HTTP Polling Auction Finalized:", data);
            testResults.auctionFinalized.push({ source: 'httpPolling', data, timestamp: Date.now() });
        });
        
        httpClient.on('error', (err) => {
            console.error("❌ HTTP Polling Error:", err);
            testResults.httpPolling.errors.push(err.message);
        });
        
        // Start connection
        await httpClient.start();
        
        console.log("✅ HTTP Polling Connected Successfully!");
        testResults.httpPolling.connected = true;
        testResults.httpPolling.clientId = clientId;
        testResults.httpPolling.transport = 'http';
        testResults.connectionOrder.push('httpPolling');
        
        // Keep connection alive for testing
        setTimeout(() => {
            console.log("🛑 Stopping HTTP Polling connection");
            httpClient.stop();
        }, 5000);
        
        return true;
        
    } catch (error) {
        console.error("❌ HTTP Polling Setup Error:", error);
        testResults.httpPolling.errors.push(error.message);
        return false;
    }
}

// Test 3: Bid Update Simulation
async function testBidUpdateSimulation() {
    console.log("\n" + "=".repeat(60));
    console.log("💰 TEST 3: BID UPDATE SIMULATION");
    console.log("=".repeat(60));
    
    try {
        const baseUrl = isLocalhost ? 'http://localhost:5500' : `${window.location.protocol}//${window.location.host}`;
        
        console.log("📡 Sending test bid update...");
        
        // Send bid update via HTTP polling API
        const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: testAuctionId,
                newBid: testBidAmount,
                bidder: testBidder,
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Bid update sent successfully:", data);
            return true;
        } else {
            console.error("❌ Bid update failed:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Bid update simulation error:", error);
        return false;
    }
}

// Test 4: Connection Status Monitoring
function monitorConnectionStatus() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST 4: CONNECTION STATUS MONITORING");
    console.log("=".repeat(60));
    
    const statusInterval = setInterval(() => {
        console.log("\n📊 Current Connection Status:");
        console.log("   Socket.IO:", testResults.socketIO.connected ? "✅ Connected" : "❌ Disconnected");
        console.log("   HTTP Polling:", testResults.httpPolling.connected ? "✅ Connected" : "❌ Disconnected");
        console.log("   Bid Updates Received:", testResults.bidUpdates.length);
        console.log("   Connection Order:", testResults.connectionOrder.join(' → '));
    }, 3000);
    
    // Stop monitoring after 15 seconds
    setTimeout(() => {
        clearInterval(statusInterval);
    }, 15000);
}

// Main test execution
async function runComprehensiveTest() {
    console.log("🚀 Starting comprehensive ngrok-compatible system test...");
    
    // Start connection monitoring
    monitorConnectionStatus();
    
    // Run tests sequentially
    const socketIOSuccess = await testSocketIO();
    const httpPollingSuccess = await testHttpPolling();
    
    // Wait a bit before testing bid updates
    setTimeout(async () => {
        await testBidUpdateSimulation();
        
        // Final summary
        setTimeout(() => {
            console.log("\n" + "=".repeat(60));
            console.log("📊 FINAL TEST SUMMARY");
            console.log("=".repeat(60));
            
            console.log("\n🔌 Connection Results:");
            console.log("   Socket.IO:", socketIOSuccess ? "✅ PASSED" : "❌ FAILED");
            console.log("   HTTP Polling:", httpPollingSuccess ? "✅ PASSED" : "❌ FAILED");
            
            console.log("\n📡 Bid Updates:");
            console.log("   Total Updates Received:", testResults.bidUpdates.length);
            testResults.bidUpdates.forEach((update, index) => {
                console.log(`   ${index + 1}. ${update.source}: ${update.data.newBid}π by ${update.data.bidder}`);
            });
            
            console.log("\n🔗 Connection Order:", testResults.connectionOrder.join(' → '));
            
            console.log("\n❌ Errors:");
            if (testResults.socketIO.errors.length > 0) {
                console.log("   Socket.IO Errors:", testResults.socketIO.errors);
            }
            if (testResults.httpPolling.errors.length > 0) {
                console.log("   HTTP Polling Errors:", testResults.httpPolling.errors);
            }
            
            console.log("\n" + "=".repeat(60));
            console.log("🎉 TEST COMPLETE!");
            console.log("=".repeat(60));
            
            if (socketIOSuccess || httpPollingSuccess) {
                console.log("✅ At least one real-time connection method is working!");
                console.log("✅ The ngrok-compatible system is operational.");
            } else {
                console.log("❌ All connection methods failed. Check server logs for details.");
            }
            
        }, 2000);
        
    }, 2000);
}

// Start the comprehensive test
runComprehensiveTest().catch(error => {
    console.error("❌ Test execution error:", error);
});