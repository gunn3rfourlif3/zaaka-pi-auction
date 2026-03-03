// COMPREHENSIVE FRONTEND DEBUG
console.log("🎯 COMPREHENSIVE FRONTEND DEBUG");
console.log("=".repeat(70));

// First, let's see what's actually on the page
console.log("📋 PAGE ANALYSIS:");
console.log(`📍 Current URL: ${window.location.href}`);
console.log(`🌐 Hostname: ${window.location.hostname}`);

// Check for auction items
const allElements = document.querySelectorAll('*');
console.log(`📊 Total elements on page: ${allElements.length}`);

// Look for anything related to auctions or bids
const auctionKeywords = ['auction', 'bid', 'price', 'current', 'highest'];
const auctionElements = [];

allElements.forEach(el => {
    const text = el.textContent?.toLowerCase() || '';
    const className = el.className?.toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    
    const hasAuctionKeyword = auctionKeywords.some(keyword => 
        text.includes(keyword) || 
        className.includes(keyword) || 
        id.includes(keyword)
    );
    
    if (hasAuctionKeyword && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
        auctionElements.push({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent?.trim().substring(0, 100),
            attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`)
        });
    }
});

console.log(`🏷️  Found ${auctionElements.length} auction-related elements:`);
auctionElements.slice(0, 10).forEach((el, i) => {
    console.log(`  ${i + 1}. <${el.tag}> ${el.className ? `class="${el.className}"` : ''} ${el.id ? `id="${el.id}"` : ''}`);
    console.log(`     Text: "${el.text}"`);
});

// Check for specific auction items
const auctionItems = document.querySelectorAll('[data-auction-id]');
console.log(`\n📦 Specific Auction Items Found: ${auctionItems.length}`);

auctionItems.forEach((item, i) => {
    const auctionId = item.getAttribute('data-auction-id');
    const currentBidEl = item.querySelector('.current-bid, .bid-amount, .price, .highest-bid');
    const currentBid = currentBidEl ? currentBidEl.textContent.trim() : 'Not found';
    
    console.log(`  Auction #${auctionId}: Current Bid = "${currentBid}"`);
});

// Check connection status
const connectionElements = document.querySelectorAll('[data-connection-status], .connection-status');
console.log(`\n📡 Connection Status Elements: ${connectionElements.length}`);
connectionElements.forEach((el, i) => {
    console.log(`  ${i + 1}: "${el.textContent.trim()}"`);
});

// Check if we're actually connected
const isNgrok = window.location.hostname.includes('ngrok');
console.log(`\n🌐 Environment: ${isNgrok ? 'NGROK' : 'LOCALHOST'}`);

// Test the actual bid update process
async function testActualBidUpdate() {
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TESTING ACTUAL BID UPDATE PROCESS");
    console.log("=".repeat(70));
    
    // Find a real auction item
    const realAuction = document.querySelector('[data-auction-id]');
    if (!realAuction) {
        console.log("❌ No auction items found on page");
        return;
    }
    
    const auctionId = realAuction.getAttribute('data-auction-id');
    console.log(`🎯 Found real auction: #${auctionId}`);
    
    // Get current bid
    const currentBidEl = realAuction.querySelector('.current-bid, .bid-amount, .price, .highest-bid');
    const currentBid = currentBidEl ? currentBidEl.textContent.trim() : 'Unknown';
    console.log(`💰 Current bid: "${currentBid}"`);
    
    // Extract numeric value
    const numericMatch = currentBid.match(/[\d.]+/);
    const currentNumeric = numericMatch ? parseFloat(numericMatch[0]) : 100;
    const newBid = currentNumeric + 50;
    
    console.log(`📈 Testing with new bid: ${newBid}`);
    
    // Send bid update
    try {
        const response = await fetch(`${window.location.origin}/api/http-poll?action=update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: parseInt(auctionId),
                newBid: newBid,
                bidder: "test_user",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            console.log(`✅ Bid update sent successfully: ${newBid}π`);
            
            // Wait and check for changes
            console.log("⏱️  Waiting 5 seconds for update to appear...");
            
            setTimeout(() => {
                const updatedBidEl = realAuction.querySelector('.current-bid, .bid-amount, .price, .highest-bid');
                const updatedBid = updatedBidEl ? updatedBidEl.textContent.trim() : 'Not found';
                
                console.log(`🔄 Updated bid: "${updatedBid}"`);
                
                if (updatedBid.includes(newBid.toString())) {
                    console.log("🎉 SUCCESS! Bid update appeared in the UI!");
                } else {
                    console.log("❌ No update detected in the UI");
                    console.log("🔍 Check console logs above for debugging information");
                }
                
            }, 5000);
            
        } else {
            console.log(`❌ Bid update failed: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Check if handleBidUpdate is available
console.log("\n🔍 Checking for handleBidUpdate function:");
if (window.handleBidUpdate) {
    console.log("✅ handleBidUpdate function found on window");
    
    // Test it directly
    console.log("🧪 Testing handleBidUpdate directly...");
    window.handleBidUpdate({
        auctionId: 3330,
        newBid: 999.99,
        bidder: "direct_test"
    });
    console.log("✅ Called handleBidUpdate with test data");
} else {
    console.log("❌ handleBidUpdate function NOT found on window");
}

// Check connection status
console.log("\n📡 Connection Status Check:");
const statusEl = document.querySelector('[data-connection-status]');
if (statusEl) {
    console.log(`Status: "${statusEl.textContent.trim()}"`);
} else {
    console.log("❌ No connection status element found");
}

// Export test function
window.testActualBidUpdate = testActualBidUpdate;

console.log("\n✅ Comprehensive debug complete!");
console.log("💡 Run window.testActualBidUpdate() to test with real auction data");

// Auto-test after 3 seconds
setTimeout(testActualBidUpdate, 3000);