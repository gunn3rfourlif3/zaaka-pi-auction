/**
 * 🧪 SIMPLE REAL-TIME BID TEST
 * Clean, error-free test for real-time bid updates
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🧪 SIMPLE REAL-TIME BID TEST");
console.log("=".repeat(40));

// Wait for page to be ready
setTimeout(() => {
    console.log("🚀 Starting bid update test...");
    
    // Test 1: Check if auction items are loaded
    function findAuctionItems() {
        const items = [];
        
        // Look for bid amounts with π symbol
        document.querySelectorAll('*').forEach((el, index) => {
            const text = el.textContent || '';
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            
            if (bidMatch && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
                // Look for auction ID nearby
                const parent = el.closest('[key]') || el.parentElement || el;
                const allText = parent.textContent || text;
                const idMatch = allText.match(/Asset #(\d+)/) || allText.match(/#(\d+)/);
                
                if (idMatch) {
                    items.push({
                        auctionId: parseInt(idMatch[1]),
                        currentBid: parseFloat(bidMatch[1]),
                        element: el,
                        text: text.trim()
                    });
                }
            }
        });
        
        return items;
    }
    
    // Test 2: Test server-side bid emission
    async function testServerEmission() {
        console.log("\n🌐 Testing server-side bid emission...");
        
        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auctionId: 1,
                    newBid: 99.99,
                    bidder: "test_user",
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
    
    // Test 3: Test client-side bid update
    function testClientBidUpdate() {
        console.log("\n🎯 Testing client-side bid update...");
        
        // Find auction items
        const items = findAuctionItems();
        console.log(`Found ${items.length} auction items`);
        
        if (items.length === 0) {
            console.log("❌ No auction items found. Make sure you're on Market or My Bids view.");
            return false;
        }
        
        // Test first item
        const firstItem = items[0];
        const testData = {
            auctionId: firstItem.auctionId,
            newBid: firstItem.currentBid + 5.00,
            bidder: "test_bidder"
        };
        
        console.log(`Testing auction #${firstItem.auctionId}:`);
        console.log(`Current bid: ${firstItem.currentBid.toFixed(2)} π`);
        console.log(`New bid: ${testData.newBid.toFixed(2)} π`);
        
        // Use existing handleBidUpdate function
        if (typeof window.handleBidUpdate === 'function') {
            const result = window.handleBidUpdate(testData);
            console.log(`✅ Client bid update test: ${result ? 'PASSED' : 'FAILED'}`);
            return result;
        } else {
            console.log("❌ handleBidUpdate function not found");
            return false;
        }
    }
    
    // Run all tests
    async function runAllTests() {
        console.log("\n🧪 Running all tests...");
        
        // Test 1: Server emission
        const serverResult = await testServerEmission();
        
        // Test 2: Client update
        const clientResult = testClientBidUpdate();
        
        console.log("\n📊 Test Results:");
        console.log(`Server Emission: ${serverResult ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Client Bid Update: ${clientResult ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (serverResult && clientResult) {
            console.log("\n🎉 ALL TESTS PASSED! Real-time bidding is working!");
            console.log("💡 Try placing a real bid to see the full flow in action.");
        } else {
            console.log("\n⚠️ Some tests failed. Check the console for details.");
            console.log("💡 Make sure auction items are loaded and visible.");
        }
    }
    
    // Make functions available globally
    window.simpleBidTest = {
        findAuctionItems,
        testServerEmission,
        testClientBidUpdate,
        runAllTests
    };
    
    // Auto-run tests
    runAllTests();
    
}, 3000); // Wait 3 seconds for page to load