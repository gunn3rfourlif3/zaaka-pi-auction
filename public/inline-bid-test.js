// INLINE REAL-TIME BID UPDATE TEST - Copy and paste directly into browser console
// This test works with actual auction items on the page

console.log("🎯 INLINE REAL-TIME BID UPDATE TEST");
console.log("=".repeat(70));
console.log("🚀 Testing if real-time bid updates work in your auction UI...");

// Quick function to find auction items
function findAuctionsQuick() {
    const items = [];
    
    // Look for items with π symbol (Pi currency)
    document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        if (text.includes('π') && text.match(/\d+\.\d+/)) {
            // Try to find auction ID nearby
            const parent = el.closest('[key]') || el.parentElement;
            const idMatch = (parent?.textContent || text).match(/Asset #(\d+)/) || text.match(/#(\d+)/);
            const bidMatch = text.match(/(\d+\.\d+)\s*π/);
            
            if (idMatch && bidMatch) {
                items.push({
                    element: el,
                    auctionId: parseInt(idMatch[1]),
                    currentBid: parseFloat(bidMatch[1]),
                    text: text.trim()
                });
            }
        }
    });
    
    return items;
}

// Quick test function
function testBidUpdateQuick(auctionId, newBid) {
    console.log(`🧪 Testing bid update for auction #${auctionId}: ${newBid} π`);
    
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: auctionId,
            newBid: newBid,
            bidder: "console_test_user"
        });
        
        console.log("✅ handleBidUpdate called successfully!");
        console.log("💡 Check if you can see the bid amount change in the UI");
        return true;
    } else {
        console.log("❌ handleBidUpdate function not found");
        console.log("💡 Make sure you're on a page with auction functionality loaded");
        return false;
    }
}

// Run the test
function runQuickTest() {
    const auctions = findAuctionsQuick();
    
    if (auctions.length === 0) {
        console.log("❌ No auction items found");
        console.log("💡 Make sure you have auction items loaded on the page");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load items");
        return;
    }
    
    console.log(`✅ Found ${auctions.length} auction items`);
    
    // Test with first item
    const firstAuction = auctions[0];
    const newBid = firstAuction.currentBid + 5.25;
    
    console.log(`\n🎯 Testing with:`);
    console.log(`   Auction ID: ${firstAuction.auctionId}`);
    console.log(`   Current Bid: ${firstAuction.currentBid} π`);
    console.log(`   New Bid: ${newBid} π`);
    console.log(`   Element: "${firstAuction.text}"`);
    
    testBidUpdateQuick(firstAuction.auctionId, newBid);
    
    console.log("\n💡 Manual test function available:");
    console.log("   window.testBidUpdateQuick(1234, 999.99) - Test any auction ID");
}

// Make functions available globally
window.testBidUpdateQuick = testBidUpdateQuick;

// Run the test
setTimeout(runQuickTest, 1000);

console.log("\n⏳ Starting test in 1 second...");
console.log("💡 Look for bid amount changes in the auction UI!");