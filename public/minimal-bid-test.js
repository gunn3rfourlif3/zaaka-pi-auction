/**
 * 🧪 MINIMAL REAL-TIME BID TEST
 * Clean, syntax-error-free test for real-time bid updates
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🧪 MINIMAL REAL-TIME BID TEST");
console.log("=".repeat(40));

// Simple function to test bid updates
function testBidUpdates() {
    console.log("🚀 Starting minimal bid update test...");
    
    // Find bid elements
    const bidElements = document.querySelectorAll('.bid-amount, [data-auction-id]');
    console.log(`Found ${bidElements.length} potential bid elements`);
    
    if (bidElements.length === 0) {
        console.log("❌ No bid elements found. Make sure auction items are loaded.");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load items.");
        return;
    }
    
    // Test server emission
    console.log("\n🌐 Testing server-side bid emission...");
    
    fetch(`${window.location.origin}/api/http-poll?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auctionId: 1,
            newBid: 99.99,
            bidder: "test_user",
            type: 'bid_update'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Server responded successfully:", data);
        console.log("💡 Monitor the page for bid updates (should appear within 30 seconds)");
    })
    .catch(error => {
        console.error("❌ Server error:", error);
    });
    
    console.log("\n📊 Test completed! Check the page for bid updates.");
}

// Make function available globally
window.testBidUpdates = testBidUpdates;

// Auto-run after page loads
setTimeout(() => {
    console.log("\n" + "=".repeat(40));
    console.log("🧪 MINIMAL REAL-TIME BID TEST - READY");
    console.log("=".repeat(40));
    console.log("💡 Run: window.testBidUpdates()");
    console.log("💡 Or wait 5 seconds for auto-test...");
    
    setTimeout(testBidUpdates, 5000);
}, 2000);