/**
 * 🎯 BID UPDATE HANDLER - Fixes real-time bid updates
 * This script properly handles bid updates and updates the UI
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🎯 BID UPDATE HANDLER - LOADING");
console.log("=".repeat(50));

// Global bid update handler
window.handleBidUpdate = function(data) {
    console.log("🎯 BID UPDATE RECEIVED:", data);
    
    if (!data || !data.auctionId || !data.newBid) {
        console.error("❌ Invalid bid update data:", data);
        return false;
    }
    
    const { auctionId, newBid, bidder } = data;
    
    // Update all visible bid displays for this auction
    let updatedCount = 0;
    
    // Method 1: Find by auction ID in data attributes
    const auctionElements = document.querySelectorAll(`[data-auction-id="${auctionId}"]`);
    auctionElements.forEach(el => {
        const bidDisplay = el.querySelector('.bid-amount, [class*="bid"], [class*="current"]');
        if (bidDisplay) {
            bidDisplay.textContent = `${Number(newBid).toFixed(2)} π`;
            updatedCount++;
            console.log(`✅ Updated bid display in data-auction-id element #${auctionId}`);
        }
    });
    
    // Method 2: Find by text content containing auction ID
    document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        
        // Look for auction ID in text
        if (text.includes(`Asset #${auctionId}`) || text.includes(`#${auctionId}`)) {
            // Find the bid amount element within this container
            const bidElements = el.querySelectorAll('*');
            bidElements.forEach(bidEl => {
                const bidText = bidEl.textContent || '';
                const bidMatch = bidText.match(/(\d+\.\d{2})\s*π/);
                
                if (bidMatch) {
                    // Update this bid amount
                    const newText = bidText.replace(bidMatch[0], `${Number(newBid).toFixed(2)} π`);
                    bidEl.textContent = newText;
                    updatedCount++;
                    console.log(`✅ Updated bid display in text-matched element #${auctionId}: ${bidMatch[1]} → ${newBid}`);
                }
            });
        }
    });
    
    // Method 3: Direct DOM manipulation for specific patterns
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const text = el.textContent || '';
        
        // Look for bid amounts with π symbol
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch) {
            const currentBid = parseFloat(bidMatch[1]);
            
            // Check if this element is related to our auction by proximity to auction ID
            const parentText = el.parentElement?.textContent || '';
            const grandparentText = el.parentElement?.parentElement?.textContent || '';
            
            if (parentText.includes(`Asset #${auctionId}`) || 
                parentText.includes(`#${auctionId}`) || 
                grandparentText.includes(`Asset #${auctionId}`) || 
                grandparentText.includes(`#${auctionId}`)) {
                
                // Update the bid amount
                const newText = text.replace(bidMatch[0], `${Number(newBid).toFixed(2)} π`);
                el.textContent = newText;
                updatedCount++;
                console.log(`✅ Updated bid display in proximity-matched element #${auctionId}: ${currentBid} → ${newBid}`);
            }
        }
    });
    
    // Method 4: Update React state if available (for better integration)
    if (window.updateAuctionItem) {
        window.updateAuctionItem(auctionId, newBid, bidder);
        updatedCount++;
        console.log(`✅ Updated via React state function`);
    }
    
    // Method 5: Update auction detail page if available
    if (window.handleAuctionDetailBidUpdate) {
        const detailUpdated = window.handleAuctionDetailBidUpdate(data);
        if (detailUpdated) {
            updatedCount++;
            console.log(`✅ Updated via auction detail page handler`);
        }
    }
    
    // Method 6: Update bid count in auction detail page
    const bidCountElements = document.querySelectorAll('.bid-count[data-auction-id="' + auctionId + '"]');
    bidCountElements.forEach(el => {
        const currentText = el.textContent || '';
        const countMatch = currentText.match(/(\d+)/);
        if (countMatch) {
            const currentCount = parseInt(countMatch[1]);
            const newCount = currentCount + 1;
            const newText = currentText.replace(countMatch[0], newCount.toString());
            el.textContent = newText;
            updatedCount++;
            console.log(`✅ Updated bid count: ${currentCount} → ${newCount}`);
        }
    });
    
    // Add visual feedback
    if (updatedCount > 0) {
        console.log(`🎉 Successfully updated ${updatedCount} bid display(s) for auction #${auctionId}`);
        
        // Add animation class to updated elements
        const updatedElements = document.querySelectorAll(`[data-auction-id="${auctionId}"]`);
        updatedElements.forEach(el => {
            el.classList.add('bid-updated');
            setTimeout(() => el.classList.remove('bid-updated'), 1000);
        });
        
        return true;
    } else {
        console.warn(`⚠️ No bid displays found for auction #${auctionId}`);
        return false;
    }
};

// Helper function to find and list all auction items
window.findAllAuctionItems = function() {
    console.log("\n🔍 FINDING ALL AUCTION ITEMS");
    console.log("=".repeat(30));
    
    const items = [];
    
    // Method 1: Look for elements with auction IDs
    document.querySelectorAll('*').forEach((el, index) => {
        const text = el.textContent || '';
        
        // Look for Asset # patterns
        const assetMatch = text.match(/Asset #(\d+)/);
        if (assetMatch) {
            const auctionId = parseInt(assetMatch[1]);
            
            // Look for bid amount in same element or nearby
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            const currentBid = bidMatch ? parseFloat(bidMatch[1]) : null;
            
            items.push({
                auctionId: auctionId,
                currentBid: currentBid,
                element: el,
                text: text.trim().substring(0, 100), // First 100 chars
                method: 'asset_pattern'
            });
        }
    });
    
    // Method 2: Look for bid amounts and try to find associated auction IDs
    document.querySelectorAll('*').forEach((el, index) => {
        const text = el.textContent || '';
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch && !items.some(item => item.element === el)) {
            const currentBid = parseFloat(bidMatch[1]);
            
            // Look for auction ID in parent elements
            let parent = el.parentElement;
            let auctionId = null;
            
            while (parent && !auctionId) {
                const parentText = parent.textContent || '';
                const assetMatch = parentText.match(/Asset #(\d+)/);
                if (assetMatch) {
                    auctionId = parseInt(assetMatch[1]);
                }
                parent = parent.parentElement;
            }
            
            if (auctionId) {
                items.push({
                    auctionId: auctionId,
                    currentBid: currentBid,
                    element: el,
                    text: text.trim().substring(0, 100),
                    method: 'bid_proximity'
                });
            }
        }
    });
    
    console.log(`Found ${items.length} auction items:`);
    items.forEach((item, i) => {
        console.log(`${i + 1}. Auction #${item.auctionId}: ${item.currentBid ? item.currentBid.toFixed(2) + ' π' : 'No bid found'} (${item.method})`);
        console.log(`   Text: "${item.text}"`);
    });
    
    return items;
};

// Test function to simulate a bid update
window.testBidUpdate = function(auctionId = 1, newBid = 99.99, bidder = "test_user") {
    console.log(`\n🧪 TESTING BID UPDATE`);
    console.log(`Auction #${auctionId}: New bid ${newBid} π by @${bidder}`);
    
    const result = window.handleBidUpdate({
        auctionId: auctionId,
        newBid: newBid,
        bidder: bidder
    });
    
    if (result) {
        console.log("✅ Bid update test successful!");
    } else {
        console.log("❌ Bid update test failed - no elements updated");
        console.log("💡 Try running window.findAllAuctionItems() to see what's available");
    }
    
    return result;
};

// Initialize and run tests
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🎯 BID UPDATE HANDLER - READY");
    console.log("=".repeat(50));
    
    // Find auction items
    const items = window.findAllAuctionItems();
    
    if (items.length > 0) {
        console.log("\n🧪 Running test bid update on first item...");
        const firstItem = items[0];
        window.testBidUpdate(firstItem.auctionId, (firstItem.currentBid || 10) + 5.50, "test_bidder");
    } else {
        console.log("\n⚠️ No auction items found. Make sure you're on the Market or My Bids view.");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load auction items.");
    }
    
    console.log("\n💡 Available functions:");
    console.log("   window.handleBidUpdate(data) - Handle bid update");
    console.log("   window.findAllAuctionItems() - Find all auction items");
    console.log("   window.testBidUpdate(id, bid, bidder) - Test bid update");
    
}, 3000); // Wait 3 seconds for page to load