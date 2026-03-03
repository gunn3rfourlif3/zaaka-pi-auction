/**
 * 🧪 REAL-TIME BID UPDATE TEST
 * This script tests if bid updates are working after the URL fixes
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🧪 REAL-TIME BID UPDATE TEST");
console.log("=".repeat(50));
console.log("🚀 Testing bid update functionality...");

// Test function to manually trigger a bid update
function testBidUpdate() {
    console.log("\n🎯 Testing manual bid update...");
    
    // Check if handleBidUpdate function exists
    if (typeof window.handleBidUpdate === 'function') {
        console.log("✅ handleBidUpdate function found");
        
        // Test with a sample bid update
        const testData = {
            auctionId: 1,
            newBid: 99.99,
            bidder: "test_user"
        };
        
        console.log("🔄 Triggering test bid update:", testData);
        window.handleBidUpdate(testData);
        console.log("✅ Test bid update triggered successfully");
        
        return true;
    } else {
        console.log("❌ handleBidUpdate function not found");
        return false;
    }
}

// Test function to check connection status
function testConnectionStatus() {
    console.log("\n📡 Testing connection status...");
    
    // Look for connection status indicator
    const connectionElements = document.querySelectorAll('[class*="connection"], [class*="status"]');
    console.log(`Found ${connectionElements.length} potential connection status elements`);
    
    // Check if we can find the WebSocket connection status
    if (window.webSocketStatus) {
        console.log("✅ WebSocket status object found:", window.webSocketStatus);
    } else {
        console.log("ℹ️ No global WebSocket status object found");
    }
    
    return true;
}

// Test function to check for auction items
function findAuctionItems() {
    console.log("\n🔍 Searching for auction items...");
    
    const bidElements = [];
    
    // Search for elements containing bid amounts
    document.querySelectorAll('*').forEach((el, index) => {
        const text = el.textContent || '';
        
        // Look for bid amounts like "25.50 π" or "100.00 π"
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            // Try to find auction ID nearby
            const parent = el.closest('[key]') || el.parentElement || el;
            const allText = parent.textContent || text;
            const idMatch = allText.match(/Asset #(\d+)/) || allText.match(/#(\d+)/);
            
            if (idMatch) {
                const auctionId = parseInt(idMatch[1]);
                const currentBid = parseFloat(bidMatch[1]);
                
                bidElements.push({
                    element: el,
                    auctionId: auctionId,
                    currentBid: currentBid,
                    elementIndex: index,
                    text: text.trim()
                });
                
                console.log(`✅ Found auction #${auctionId}: ${currentBid.toFixed(2)} π - "${text.trim()}"`);
            }
        }
    });
    
    console.log(`\n📊 Found ${bidElements.length} auction items with bid amounts`);
    
    if (bidElements.length === 0) {
        console.log("❌ No auction items found with bid amounts");
        console.log("💡 Make sure you're on the 'Market' or 'My Bids' view");
        console.log("💡 Auction items should show bid amounts like '25.50 π'");
    }
    
    return bidElements;
}

// Test function to simulate server-side bid update
async function testServerBidUpdate() {
    console.log("\n🌐 Testing server-side bid update emission...");
    
    try {
        // Get current location for API call
        const baseUrl = window.location.origin;
        console.log(`📍 Using base URL: ${baseUrl}`);
        
        // Test the HTTP polling endpoint
        const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auctionId: 1,
                newBid: 123.45,
                bidder: "server_test_user",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            console.log("✅ Server bid update endpoint responded successfully");
            const data = await response.json();
            console.log("📋 Response data:", data);
        } else {
            console.log("❌ Server bid update endpoint failed:", response.status, response.statusText);
        }
        
    } catch (error) {
        console.error("❌ Error testing server bid update:", error);
    }
}

// Main test function
function runRealTimeBidTest() {
    console.log("🧪 Starting Real-Time Bid Update Test Suite...\n");
    
    // Test 1: Find auction items
    const auctionItems = findAuctionItems();
    
    // Test 2: Check connection status
    testConnectionStatus();
    
    // Test 3: Test client-side bid update
    const bidUpdateWorks = testBidUpdate();
    
    // Test 4: Test server-side bid update (if items found)
    if (auctionItems.length > 0) {
        testServerBidUpdate();
    }
    
    // Test 5: Monitor for real updates
    console.log("\n👂 Setting up listener for real bid updates...");
    
    // Override handleBidUpdate to log real updates
    const originalHandleBidUpdate = window.handleBidUpdate;
    window.handleBidUpdate = function(data) {
        console.log("🎯 REAL BID UPDATE RECEIVED:", data);
        if (originalHandleBidUpdate) {
            originalHandleBidUpdate(data);
        }
    };
    
    console.log("\n✅ Test suite completed!");
    console.log("💡 Monitor the console for real bid updates");
    console.log("💡 Place a bid to test the full flow");
    
    return {
        auctionItemsFound: auctionItems.length,
        bidUpdateFunction: bidUpdateWorks,
        connectionStatus: 'monitoring'
    };
}

// Auto-run the test
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 REAL-TIME BID UPDATE TEST - AUTO STARTING");
    console.log("=".repeat(50));
    
    const results = runRealTimeBidTest();
    
    // Make test functions available globally
    window.testBidUpdate = testBidUpdate;
    window.findAuctionItems = findAuctionItems;
    window.testServerBidUpdate = testServerBidUpdate;
    window.runRealTimeBidTest = runRealTimeBidTest;
    
    console.log("\n💡 Available test functions:");
    console.log("   window.testBidUpdate() - Test client-side bid update");
    console.log("   window.findAuctionItems() - Find auction items");
    console.log("   window.testServerBidUpdate() - Test server-side emission");
    console.log("   window.runRealTimeBidTest() - Run full test suite");
    
}, 2000); // Wait 2 seconds for page to load