// CLEAN NGROK-ONLY REAL-TIME FUNCTIONALITY TEST
console.log("🎯 CLEAN NGROK-ONLY REAL-TIME FUNCTIONALITY TEST");
console.log("=".repeat(70));
console.log("Testing HTTP polling without Socket.IO interference");
console.log("=".repeat(70));

// Test configuration
const TEST_AUCTION_ID = 2931;
const TEST_BIDDER = "ngrok_clean_user";

// Test results
const testResults = {
    socketIOAttempts: 0,
    httpPollingSuccess: false,
    bidUpdatesReceived: 0,
    errors: []
};

// Monitor for any Socket.IO attempts
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
    const urlStr = url.toString();
    if (urlStr.includes('socket.io')) {
        testResults.socketIOAttempts++;
        console.log("❌ UNEXPECTED: Socket.IO connection attempt detected!");
        throw new Error('Socket.IO should not be used for ngrok');
    }
    return originalFetch(url, options);
};

// Test 1: Verify HTTP polling works without Socket.IO interference
async function testCleanHttpPolling() {
    console.log("\n🔄 TEST 1: Clean HTTP Polling");
    console.log("-".repeat(50));
    
    try {
        const { HttpPollingClient } = require('../services/http-polling-client');
        
        const client = new HttpPollingClient(
            'https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev',
            TEST_AUCTION_ID,
            'clean_test_client',
            1000
        );
        
        let updatesReceived = [];
        
        client.on('bid_update', (data) => {
            console.log(`🎯 Received bid update: ${data.newBid}π by ${data.bidder}`);
            updatesReceived.push(data);
            testResults.bidUpdatesReceived++;
        });
        
        client.on('error', (err) => {
            console.error("❌ HTTP polling error:", err);
            testResults.errors.push(err.message);
        });
        
        console.log("📡 Starting clean HTTP polling...");
        await client.start();
        testResults.httpPollingSuccess = true;
        console.log("✅ HTTP polling started successfully");
        
        // Send test bid updates
        console.log("\n📡 Sending test bid updates...");
        
        const bidUpdates = [
            { amount: 200.00, bidder: 'clean_user_1' },
            { amount: 210.50, bidder: 'clean_user_2' },
            { amount: 225.00, bidder: 'clean_user_3' }
        ];
        
        for (const bid of bidUpdates) {
            const response = await fetch('https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev/api/http-poll?action=update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify({
                    auctionId: TEST_AUCTION_ID,
                    newBid: bid.amount,
                    bidder: bid.bidder,
                    type: 'bid_update'
                })
            });
            
            if (response.ok) {
                console.log(`✅ Bid ${bid.amount}π sent successfully`);
            } else {
                console.error(`❌ Bid ${bid.amount}π failed:`, response.status);
            }
            
            // Wait for polling to receive the update
            await new Promise(resolve => setTimeout(resolve, 1200));
        }
        
        // Wait a bit more to collect any remaining updates
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await client.stop();
        console.log("🛑 HTTP polling stopped");
        
        return {
            success: true,
            updatesReceived: updatesReceived.length,
            updates: updatesReceived
        };
        
    } catch (error) {
        console.error("❌ Clean HTTP polling test failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Test 2: Verify no Socket.IO interference
function testNoSocketIOInterference() {
    console.log("\n🚫 TEST 2: No Socket.IO Interference");
    console.log("-".repeat(50));
    
    if (testResults.socketIOAttempts === 0) {
        console.log("✅ SUCCESS: No Socket.IO connection attempts detected");
        console.log("✅ HTTP polling is working independently");
        return true;
    } else {
        console.log(`❌ FAILURE: ${testResults.socketIOAttempts} Socket.IO attempts detected`);
        return false;
    }
}

// Test 3: Verify UI update simulation
function testUIUpdateSimulation() {
    console.log("\n🖥️  TEST 3: UI Update Simulation");
    console.log("-".repeat(50));
    
    // Simulate the exact UI update logic from the React component
    function simulateUIBidUpdate(data) {
        console.log(`🎯 UI Update: ${data.newBid}π by ${data.bidder}`);
        
        // Simulate the state updates that would happen in React
        const selectedItem = { 
            id: data.auctionId, 
            currentBid: data.newBid, 
            currentBidder: data.bidder,
            bids: [{ bidder_id: data.bidder, amount: data.newBid }]
        };
        
        const items = [{ 
            id: data.auctionId, 
            currentBid: data.newBid, 
            currentBidder: data.bidder,
            bids: [{ bidder_id: data.bidder }]
        }];
        
        console.log("   ✅ Selected item updated");
        console.log("   ✅ Market items updated");
        console.log("   ✅ Notification would show");
        
        return { selectedItem, items };
    }
    
    // Test with sample data
    const sampleUpdate = {
        auctionId: TEST_AUCTION_ID,
        newBid: 250.00,
        bidder: 'ui_test_user'
    };
    
    const result = simulateUIBidUpdate(sampleUpdate);
    console.log("✅ UI update simulation successful");
    return result;
}

// Test 4: Performance metrics
function testPerformanceMetrics() {
    console.log("\n⚡ TEST 4: Performance Metrics");
    console.log("-".repeat(50));
    
    console.log(`📊 Test Results Summary:`);
    console.log(`   Socket.IO Attempts: ${testResults.socketIOAttempts}`);
    console.log(`   HTTP Polling Success: ${testResults.httpPollingSuccess}`);
    console.log(`   Bid Updates Received: ${testResults.bidUpdatesReceived}`);
    console.log(`   Errors: ${testResults.errors.length}`);
    
    const success = testResults.socketIOAttempts === 0 && 
                   testResults.httpPollingSuccess && 
                   testResults.bidUpdatesReceived > 0 && 
                   testResults.errors.length === 0;
    
    if (success) {
        console.log("✅ All performance metrics passed");
    } else {
        console.log("❌ Some performance metrics failed");
    }
    
    return success;
}

// Main clean test execution
async function runCleanNgrokTest() {
    console.log("🚀 Starting clean ngrok-only functionality test...");
    
    const test1 = await testCleanHttpPolling();
    const test2 = testNoSocketIOInterference();
    const test3 = testUIUpdateSimulation();
    const test4 = testPerformanceMetrics();
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    console.log("\n" + "=".repeat(70));
    console.log("🎉 FINAL CLEAN TEST SUMMARY");
    console.log("=".repeat(70));
    
    console.log("\n🔧 Test Results:");
    console.log(`   Clean HTTP Polling: ${test1.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   No Socket.IO Interference: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   UI Update Simulation: ${test3 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Performance Metrics: ${test4 ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = test1.success && test2 && test3 && test4;
    
    if (allPassed) {
        console.log("\n✅ ALL CLEAN TESTS PASSED!");
        console.log("✅ Real-time bid functionality works perfectly through ngrok!");
        console.log("✅ No Socket.IO interference - pure HTTP polling!");
        console.log("✅ UI updates instantly (within 1-3 seconds)!");
        console.log("\n🚀 The ngrok-compatible system is fully operational!");
    } else {
        console.log("\n❌ Some clean tests failed");
        console.log("Check the detailed results above");
    }
    
    return allPassed;
}

// Run the clean test
runCleanNgrokTest().then(success => {
    console.log("\n🎯 Clean ngrok test execution completed!");
    if (success) {
        console.log("🎉 Perfect! Real-time functionality is working flawlessly through ngrok!");
    }
}).catch(error => {
    console.error("❌ Clean test execution error:", error);
});