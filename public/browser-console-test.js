// SIMPLE BROWSER CONSOLE TEST
// Copy and paste this directly into your browser console (F12)

console.log("🎯 SIMPLE BROWSER CONSOLE TEST");
console.log("=".repeat(70));

// Find auction items on your page
function findAuctionItems() {
    console.log("🔍 Finding auction items...");
    
    // Look for common auction patterns
    const selectors = [
        '[data-auction-id]',
        '.auction-item',
        '.item-card',
        '.product-card',
        '.listing',
        '[class*="auction"]',
        '[class*="item"]',
        '[class*="card"]'
    ];
    
    const foundItems = [];
    
    selectors.forEach(selector => {
        try {
            const items = document.querySelectorAll(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items with selector: ${selector}`);
                foundItems.push(...items);
            }
        } catch (e) {
            // Invalid selector
        }
    });
    
    // Remove duplicates
    const uniqueItems = Array.from(new Set(foundItems));
    console.log(`\n🎯 Total unique items found: ${uniqueItems.length}`);
    
    return uniqueItems;
}

// Find bid amounts in elements
function findBidAmounts(element) {
    const text = element.textContent;
    const patterns = [
        /current bid:?\s*([\d,]+\.?\d*)/i,
        /highest bid:?\s*([\d,]+\.?\d*)/i,
        /bid:?\s*([\d,]+\.?\d*)/i,
        /price:?\s*([\d,]+\.?\d*)/i,
        /π\s*([\d,]+\.?\d*)/i,
        /([\d,]+\.?\d*)\s*π/i
    ];
    
    for (let pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                amount: parseFloat(match[1].replace(',', '')),
                text: match[0],
                pattern: pattern.toString()
            };
        }
    }
    
    // Look for any numbers that might be prices
    const numberMatch = text.match(/[\d,]+\.?\d*/);
    if (numberMatch) {
        const num = parseFloat(numberMatch[0].replace(',', ''));
        if (num > 0 && num < 100000) { // Reasonable price range
            return {
                amount: num,
                text: numberMatch[0],
                pattern: 'generic number'
            };
        }
    }
    
    return null;
}

// Test with found items
function testWithFoundItems() {
    const items = findAuctionItems();
    
    if (items.length === 0) {
        console.log("❌ No auction items found!");
        console.log("🔍 Let's check what's actually on your page...");
        
        // Show all text content
        const pageText = document.body.innerText;
        const lines = pageText.split('\n').filter(line => line.trim().length > 0);
        
        console.log("📄 Page content (first 20 lines):");
        lines.slice(0, 20).forEach((line, i) => {
            console.log(`${i + 1}: ${line.trim()}`);
        });
        
        return;
    }
    
    // Test with first item
    const firstItem = items[0];
    console.log("\n🧪 Testing with first item:");
    console.log(`Element: <${firstItem.tagName}>`);
    console.log(`Classes: ${firstItem.className || 'none'}`);
    console.log(`ID: ${firstItem.id || 'none'}`);
    console.log(`Text preview: "${firstItem.textContent.trim().substring(0, 100)}"`);
    
    // Find bid amount
    const bidInfo = findBidAmounts(firstItem);
    
    if (bidInfo) {
        console.log(`💰 Found bid amount: ${bidInfo.amount} (from "${bidInfo.text}")`);
        
        // Find auction ID
        const auctionId = firstItem.getAttribute('data-auction-id') || 
                         firstItem.getAttribute('data-id') ||
                         firstItem.textContent.match(/#?(\d+)/)?.[1] ||
                         '1234'; // fallback
        
        console.log(`🏷️ Auction ID: ${auctionId}`);
        
        // Test bid update
        const newBid = bidInfo.amount + 50;
        console.log(`📈 Testing with new bid: ${newBid}`);
        
        // Test the handleBidUpdate function
        if (window.handleBidUpdate) {
            console.log("✅ handleBidUpdate function found!");
            
            console.log(`🧪 Calling handleBidUpdate({auctionId: ${auctionId}, newBid: ${newBid}, bidder: "test_user"})`);
            
            window.handleBidUpdate({
                auctionId: parseInt(auctionId),
                newBid: newBid,
                bidder: "test_user"
            });
            
            console.log("✅ Called handleBidUpdate!");
            
            // Check if UI updated
            setTimeout(() => {
                const updatedBidInfo = findBidAmounts(firstItem);
                if (updatedBidInfo && updatedBidInfo.amount === newBid) {
                    console.log("🎉 SUCCESS! UI updated with new bid amount!");
                } else {
                    console.log("❌ UI did not update - checking what happened...");
                    console.log("Current bid info:", updatedBidInfo);
                }
            }, 2000);
            
        } else {
            console.log("❌ handleBidUpdate function not found on window");
        }
        
    } else {
        console.log("❌ Could not find bid amount in this item");
        console.log("Text content:", firstItem.textContent.trim().substring(0, 200));
    }
}

// Run the test
console.log("🚀 Starting browser console test...");
testWithFoundItems();

// Export functions for manual testing
window.findMyAuctions = findAuctionItems;
window.testBidUpdate = function(auctionId, newBid) {
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: auctionId,
            newBid: newBid,
            bidder: "manual_test"
        });
        console.log(`✅ Sent bid update: ${newBid} for auction #${auctionId}`);
    } else {
        console.log("❌ handleBidUpdate not found");
    }
};

console.log("\n💡 Manual test functions available:");
console.log("   window.findMyAuctions() - Find auction items on page");
console.log("   window.testBidUpdate(1234, 999.99) - Test bid update");