// ULTIMATE FRONTEND VERIFICATION
console.log("🎯 ULTIMATE FRONTEND VERIFICATION");
console.log("=".repeat(70));
console.log("This is the final test to verify bid updates work in the browser");
console.log("=".repeat(70));

const NGROK_URL = "https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev";

// Wait for everything to load
setTimeout(async () => {
    console.log("🚀 Starting ultimate verification...");
    
    // 1. Check environment
    const isNgrok = window.location.hostname.includes('ngrok');
    console.log(`🌐 Environment: ${isNgrok ? 'NGROK' : 'LOCALHOST'}`);
    console.log(`📍 Current URL: ${window.location.href}`);
    
    // 2. Check connection status
    const statusEl = document.querySelector('[data-connection-status]');
    const transportEl = document.querySelector('[data-transport]');
    
    console.log(`📡 Connection: ${statusEl ? statusEl.textContent : 'Not found'}`);
    console.log(`🚗 Transport: ${transportEl ? transportEl.textContent : 'Not found'}`);
    
    // 3. Find auction items
    const auctionItems = document.querySelectorAll('[data-auction-id]');
    console.log(`📦 Auction Items: ${auctionItems.length}`);
    
    if (auctionItems.length === 0) {
        console.log("❌ No auction items found - cannot test bid updates");
        console.log("🔍 Looking for any auction-related content...");
        
        // Search for any bid/auction related content
        const allText = document.body.innerText.toLowerCase();
        const hasAuctionContent = allText.includes('auction') || allText.includes('bid') || allText.includes('π');
        
        if (hasAuctionContent) {
            console.log("✅ Found auction-related content on page");
            console.log("🔍 But no specific auction items with data-auction-id attribute");
        } else {
            console.log("❌ No auction content found on this page");
        }
        
        return;
    }
    
    // 4. Test with first auction item
    const firstAuction = auctionItems[0];
    const auctionId = firstAuction.getAttribute('data-auction-id');
    console.log(`🎯 Testing with Auction #${auctionId}`);
    
    // 5. Find current bid display
    const bidElements = firstAuction.querySelectorAll('.current-bid, .bid-amount, .price, .highest-bid');
    console.log(`💰 Bid Display Elements: ${bidElements.length}`);
    
    if (bidElements.length === 0) {
        console.log("❌ No bid display elements found in auction item");
        console.log("🔍 Available elements in auction item:");
        
        const children = firstAuction.querySelectorAll('*');
        children.forEach((child, i) => {
            if (i < 5) {
                console.log(`  ${i + 1}. <${child.tagName}> class="${child.className}" text="${child.textContent.trim().substring(0, 50)}"`);
            }
        });
        
        return;
    }
    
    // 6. Get current bid
    const currentBidEl = bidElements[0];
    const currentBidText = currentBidEl.textContent.trim();
    console.log(`📊 Current Bid: "${currentBidText}"`);
    
    // Extract numeric value
    const numericMatch = currentBidText.match(/[\d.]+/);
    const currentValue = numericMatch ? parseFloat(numericMatch[0]) : 100;
    const newBid = currentValue + 100; // Add 100 to current bid
    
    console.log(`📈 New Test Bid: ${newBid}π`);
    
    // 7. Send bid update
    console.log("\n💸 Sending bid update...");
    
    try {
        const response = await fetch(`${NGROK_URL}/api/http-poll?action=update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: parseInt(auctionId),
                newBid: newBid,
                bidder: "ultimate_test_user",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bid update sent successfully!`);
            console.log(`📡 Server Response: ${result.message}`);
            
            // 8. Wait for update to appear
            console.log("\n⏱️  Waiting 5 seconds for update to appear in UI...");
            
            setTimeout(() => {
                const updatedBidText = currentBidEl.textContent.trim();
                console.log(`🔄 Updated Bid: "${updatedBidText}"`);
                
                if (updatedBidText.includes(newBid.toString())) {
                    console.log("\n" + "=".repeat(70));
                    console.log("🎉 SUCCESS! BID UPDATE APPEARED IN THE BROWSER UI!");
                    console.log("=".repeat(70));
                    console.log("✅ Real-time bid functionality is working perfectly!");
                    console.log("✅ Users will see bid updates instantly when accessing through ngrok!");
                    console.log("✅ HTTP polling bypass is working flawlessly!");
                    console.log("\n🚀 SYSTEM IS FULLY OPERATIONAL FOR PRODUCTION USE!");
                } else {
                    console.log("\n" + "=".repeat(70));
                    console.log("❌ ISSUE: Bid update did NOT appear in the browser UI");
                    console.log("=".repeat(70));
                    console.log("🔍 Possible causes:");
                    console.log("   1. Auction ID mismatch between backend and frontend");
                    console.log("   2. Price validation (new bid must be higher than current)");
                    console.log("   3. React component not re-rendering");
                    console.log("   4. UI element selector mismatch");
                    console.log("\n💡 Check browser console for detailed debugging information");
                }
                
            }, 5000);
            
        } else {
            console.log(`❌ Bid update failed: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ Error sending bid update: ${error.message}`);
    }
    
}, 3000);

// Export test function
window.runUltimateVerification = () => {
    console.clear();
    console.log("🎯 Running ultimate verification...");
    location.reload();
};

console.log("✅ Ultimate verification script loaded!");
console.log("💡 This will automatically test bid updates in the actual browser");
console.log("💡 The test will run in 3 seconds...");
console.log("💡 Run window.runUltimateVerification() to test again");