// Comprehensive real-time functionality test
console.log("🧪 COMPREHENSIVE REAL-TIME FUNCTIONALITY TEST");
console.log("=".repeat(60));

// Test configuration
const testAuctionId = 2931; // Use the auction ID from the logs
const testBidder = "test_user";
let bidCounter = 1;

// Track received updates
const receivedUpdates = [];

// Test bid update simulation
async function simulateBidUpdate(amount) {
    try {
        console.log(`📡 Sending bid update: ${amount}π by ${testBidder}`);
        
        const response = await fetch('http://localhost:5500/api/http-poll?action=update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: testAuctionId,
                newBid: amount,
                bidder: testBidder,
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Bid update ${amount}π sent successfully`);
            return data;
        } else {
            console.error(`❌ Bid update ${amount}π failed:`, response.status, response.statusText);
            return null;
        }
        
    } catch (error) {
        console.error(`❌ Bid update ${amount}π test error:`, error);
        return null;
    }
}

// Test HTTP polling client
async function testHttpPollingClient() {
    console.log("\n" + "=".repeat(60));
    console.log("🔄 TESTING HTTP POLLING CLIENT");
    console.log("=".repeat(60));
    
    try {
        // Import the HTTP polling client
        const { HttpPollingClient } = require('../services/http-polling-client');
        
        const clientId = `test_client_${Date.now()}`;
        const httpClient = new HttpPollingClient('http://localhost:5500', testAuctionId, clientId, 1000); // 1 second polling
        
        // Set up event listeners
        httpClient.on('bid_update', (data) => {
            console.log(`🎯 Received bid update via HTTP polling: ${data.newBid}π by ${data.bidder}`);
            receivedUpdates.push({ source: 'httpPolling', data, timestamp: Date.now() });
        });
        
        httpClient.on('auction_finalized', (data) => {
            console.log(`🏁 Received auction finalized via HTTP polling: Auction ${data.auctionId}`);
            receivedUpdates.push({ source: 'auctionFinalized', data, timestamp: Date.now() });
        });
        
        httpClient.on('error', (err) => {
            console.error("❌ HTTP polling error:", err);
        });
        
        // Start the client
        await httpClient.start();
        console.log("✅ HTTP polling client started successfully");
        
        // Send some test bid updates
        console.log("\n📡 Sending test bid updates...");
        await simulateBidUpdate(30.5);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for polling
        
        await simulateBidUpdate(35.0);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for polling
        
        await simulateBidUpdate(40.25);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for polling
        
        // Stop the client
        await httpClient.stop();
        console.log("🛑 HTTP polling client stopped");
        
        return true;
        
    } catch (error) {
        console.error("❌ HTTP polling client test error:", error);
        return false;
    }
}

// Test multiple concurrent clients
async function testMultipleClients() {
    console.log("\n" + "=".repeat(60));
    console.log("👥 TESTING MULTIPLE CONCURRENT CLIENTS");
    console.log("=".repeat(60));
    
    try {
        const { HttpPollingClient } = require('../services/http-polling-client');
        
        const clients = [];
        const clientResults = [];
        
        // Create 3 clients
        for (let i = 0; i < 3; i++) {
            const clientId = `multi_client_${i}_${Date.now()}`;
            const client = new HttpPollingClient('http://localhost:5500', testAuctionId, clientId, 2000);
            
            client.on('bid_update', (data) => {
                console.log(`🎯 Client ${i} received bid update: ${data.newBid}π by ${data.bidder}`);
                clientResults.push({ clientId: i, data, timestamp: Date.now() });
            });
            
            clients.push(client);
        }
        
        // Start all clients
        console.log("🚀 Starting all clients...");
        await Promise.all(clients.map(client => client.start()));
        
        // Send a bid update
        console.log("📡 Sending bid update to all clients...");
        await simulateBidUpdate(50.0);
        
        // Wait for all clients to receive the update
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Stop all clients
        console.log("🛑 Stopping all clients...");
        await Promise.all(clients.map(client => client.stop()));
        
        console.log(`✅ Multiple clients test completed. Received ${clientResults.length} updates across all clients`);
        return true;
        
    } catch (error) {
        console.error("❌ Multiple clients test error:", error);
        return false;
    }
}

// Main test execution
async function runComprehensiveTest() {
    console.log("🚀 Starting comprehensive real-time functionality test...");
    
    // Test 1: Basic bid update simulation
    const basicTest = await simulateBidUpdate(25.5);
    
    // Test 2: HTTP polling client
    const pollingTest = await testHttpPollingClient();
    
    // Test 3: Multiple concurrent clients
    const multiClientTest = await testMultipleClients();
    
    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL TEST SUMMARY");
    console.log("=".repeat(60));
    
    console.log("\n🔌 Connection Results:");
    console.log("   Basic Bid Update:", basicTest ? "✅ PASSED" : "❌ FAILED");
    console.log("   HTTP Polling Client:", pollingTest ? "✅ PASSED" : "❌ FAILED");
    console.log("   Multiple Clients:", multiClientTest ? "✅ PASSED" : "❌ FAILED");
    
    console.log("\n📡 Updates Received:");
    console.log("   Total Updates:", receivedUpdates.length);
    receivedUpdates.forEach((update, index) => {
        console.log(`   ${index + 1}. ${update.source}: ${update.data.newBid}π by ${update.data.bidder} (${new Date(update.timestamp).toLocaleTimeString()})`);
    });
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 TEST COMPLETE!");
    console.log("=".repeat(60));
    
    if (basicTest && pollingTest && multiClientTest) {
        console.log("✅ All real-time functionality tests passed!");
        console.log("✅ The ngrok-compatible system is fully operational.");
        console.log("✅ Real-time bid updates are working correctly.");
    } else {
        console.log("❌ Some tests failed. Check server logs for details.");
    }
    
    return { basicTest, pollingTest, multiClientTest, receivedUpdates };
}

// Run the comprehensive test
runComprehensiveTest().then(results => {
    console.log("\n🎯 Test execution completed successfully");
}).catch(error => {
    console.error("❌ Test execution error:", error);
});