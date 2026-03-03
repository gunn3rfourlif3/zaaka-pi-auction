// 🎲 SIMPLE RANDOM BID GENERATOR - Paste directly in console (F12)
// This will continuously update bid amounts to show real-time functionality

console.clear();
console.log("🎲 SIMPLE RANDOM BID GENERATOR");
console.log("=".repeat(50));
console.log("🚀 Starting live bid updates...");

// Find all bid elements
const bidElements = [];
document.querySelectorAll('*').forEach(el => {
    const text = el.textContent || '';
    const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
    if (bidMatch && el.tagName !== 'SCRIPT') {
        const idMatch = (el.closest('[key]')?.textContent || text).match(/#(\d+)/);
        if (idMatch) {
            bidElements.push({
                element: el,
                auctionId: parseInt(idMatch[1]),
                currentBid: parseFloat(bidMatch[1])
            });
        }
    }
});

if (bidElements.length === 0) {
    console.log("❌ No bid elements found. Make sure auction items are loaded.");
    return;
}

console.log(`✅ Found ${bidElements.length} bid elements`);

// Start random bid generation
let count = 0;
function generateBid() {
    const item = bidElements[Math.floor(Math.random() * bidElements.length)];
    const increment = Math.round((Math.random() * 2 + 0.10) * 100) / 100;
    const newBid = item.currentBid + increment;
    
    // Update via handleBidUpdate
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: item.auctionId,
            newBid: newBid,
            bidder: "demo_user_" + Math.floor(Math.random() * 1000)
        });
        
        // Also update UI immediately
        item.element.textContent = item.element.textContent.replace(/\d+\.\d{2}/, newBid.toFixed(2));
        item.element.style.backgroundColor = '#fef3c7';
        setTimeout(() => item.element.style.backgroundColor = '', 300);
        
        item.currentBid = newBid;
        count++;
        console.log(`🎯 Auction #${item.auctionId}: ${newBid.toFixed(2)} π`);
    }
    
    if (count < 50) { // Limit to 50 updates
        setTimeout(generateBid, Math.random() * 3000 + 1000);
    } else {
        console.log("🎉 Demo completed! 50 bid updates shown.");
    }
}

setTimeout(generateBid, 1000);
console.log("⏰ New bids every 1-4 seconds...");
console.log("👀 Watch the auction UI for live updates!");