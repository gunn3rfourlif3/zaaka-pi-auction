/**
 * 🧪 SIMPLE BID UPDATE TEST
 * Quick test to verify real-time bid updates are working
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🧪 SIMPLE BID UPDATE TEST");
console.log("=".repeat(40));

// Quick test function
function testBidUpdate() {
    console.log("\n🎯 Testing bid update functionality...");
    
    // Find bid elements
    const bidElements = document.querySelectorAll('.bid-amount');
    console.log(`Found ${bidElements.length} bid elements with .bid-amount class`);
    
    if (bidElements.length === 0) {
        console.log("❌ No bid elements found. Make sure auction items are loaded.");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load items.");
        return false;
    }
    
    // Test first element
    const firstElement = bidElements[0];
    const auctionId = firstElement.getAttribute('data-auction-id');
    const currentText = firstElement.textContent || '';
    
    console.log(`Testing auction #${auctionId}: "${currentText}"`);
    
    // Simulate bid update
    const testData = {
        auctionId: parseInt(auctionId),
        newBid: 99.99,
        bidder: "test_user"
    };
    
    console.log("🔄 Sending test bid update:", testData);
    
    // Use the existing handleBidUpdate function
    if (typeof window.handleBidUpdate === 'function') {
        const result = window.handleBidUpdate(testData);
        console.log(`✅ Bid update function returned: ${result}`);
        return result;
    } else {
        console.log("❌ handleBidUpdate function not found");
        return false;
    }
}

// Test server emission
async function testServerEmission() {
    console.log("\n🌐 Testing server-side bid emission...");
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auctionId: 1,
                newBid: 123.45,
                bidder: "server_test",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            console.log("✅ Server responded successfully");
            const data = await response.json();
            console.log("📋 Response:", data);
            return true;
        } else {
            console.log("❌ Server error:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error testing server emission:", error);
        return false;
    }
}

// Check connection status
function checkConnectionStatus() {
    console.log("\n📡 Checking connection status...");
    
    // Look for connection indicators
    const connectionElements = document.querySelectorAll('[class*="connection"], [class*="status"]');
    console.log(`Found ${connectionElements.length} potential connection elements`);
    
    // Check HTTP polling status
    const httpPollElements = document.querySelectorAll('[id*="http"], [class*="http"]');
    console.log(`Found ${httpPollElements.length} HTTP-related elements`);
    
    return true;
}

// Main test function
function runSimpleTest() {
    console.log("\n🚀 Starting simple bid update test...\n");
    
    // Check connection status
    checkConnectionStatus();
    
    // Find and test bid elements
    const bidTestResult = testBidUpdate();
    
    // Test server emission
    testServerEmission().then(serverResult => {
        console.log("\n📊 Test Results:");
        console.log(`Bid Update Test: ${bidTestResult ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Server Emission Test: ${serverResult ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (bidTestResult && serverResult) {
            console.log("\n🎉 ALL TESTS PASSED! Real-time bid updates are working!");
        } else {
            console.log("\n⚠️ Some tests failed. Check the console for details.");
        }
    });
    
    return true;
}

// Auto-run test after page loads
setTimeout(() => {
    console.log("\n" + "=".repeat(40));
    console.log("🧪 SIMPLE BID UPDATE TEST - AUTO STARTING");
    console.log("=".repeat(40));
    
    runSimpleTest();
    
    // Make functions available globally
    window.testBidUpdate = testBidUpdate;
    window.testServerEmission = testServerEmission;
    window.runSimpleTest = runSimpleTest;
    
    console.log("\n💡 Available functions:");
    console.log("   window.testBidUpdate() - Test bid update");
    console.log("   window.testServerEmission() - Test server emission");
    console.log("   window.runSimpleTest() - Run full test");
    
}, 3000); // Wait 3 seconds for page to load