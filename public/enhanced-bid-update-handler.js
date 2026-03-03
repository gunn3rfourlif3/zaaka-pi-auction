/**
 * 🎯 ENHANCED BID UPDATE HANDLER - Fixes intermittent real-time updates
 * This script provides robust bid update handling with better reliability
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🎯 ENHANCED BID UPDATE HANDLER - LOADING");
console.log("=".repeat(60));

// Enhanced bid update handler with better reliability
window.handleBidUpdateEnhanced = function(data) {
    console.log("🎯 ENHANCED BID UPDATE RECEIVED:", data);
    
    if (!data || !data.auctionId || !data.newBid) {
        console.error("❌ Invalid bid update data:", data);
        return false;
    }
    
    const { auctionId, newBid, bidder } = data;
    
    // Update all visible bid displays for this auction
    let updatedCount = 0;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Method 1: Find by auction ID in data attributes (most reliable)
    const auctionElements = document.querySelectorAll(`[data-auction-id="${auctionId}"]`);
    auctionElements.forEach(el => {
        const bidDisplay = el.querySelector('.bid-amount, [class*="bid"], [class*="current"]');
        if (bidDisplay) {
            bidDisplay.textContent = `${Number(newBid).toFixed(2)} π`;
            updatedCount++;
            console.log(`✅ Updated bid display in data-auction-id element #${auctionId}`);
        }
    });
    
    // Method 2: Find by text content containing auction ID (fallback)
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
    
    // Method 3: Direct DOM manipulation for specific patterns (comprehensive)
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
    
    // Add visual feedback with retry mechanism
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
        
        // Retry mechanism for intermittent failures
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retrying bid update (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(() => {
                return window.handleBidUpdateEnhanced(data);
            }, 500 * retryCount);
        }
        
        return false;
    }
};

// Enhanced auction item finder
window.findAllAuctionItemsEnhanced = function() {
    console.log("\n🔍 ENHANCED AUCTION ITEM FINDER");
    console.log("=".repeat(40));
    
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
            let foundMethod = 'bid_amount';
            
            while (parent && !auctionId) {
                const parentText = parent.textContent || '';
                const idMatch = parentText.match(/Asset #(\d+)/) || parentText.match(/#(\d+)/);
                
                if (idMatch) {
                    auctionId = parseInt(idMatch[1]);
                    foundMethod = 'parent_search';
                    break;
                }
                
                // Check for data attributes
                const dataAuctionId = parent.getAttribute('data-auction-id');
                if (dataAuctionId) {
                    auctionId = parseInt(dataAuctionId);
                    foundMethod = 'data_attribute';
                    break;
                }
                
                parent = parent.parentElement;
            }
            
            if (auctionId) {
                items.push({
                    auctionId: auctionId,
                    currentBid: currentBid,
                    element: el,
                    text: text.trim().substring(0, 100),
                    method: foundMethod
                });
            }
        }
    });
    
    // Method 3: Look for data-auction-id attributes
    document.querySelectorAll('[data-auction-id]').forEach(el => {
        const auctionId = parseInt(el.getAttribute('data-auction-id') || '0');
        if (auctionId > 0 && !items.some(item => item.auctionId === auctionId)) {
            const text = el.textContent || '';
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            const currentBid = bidMatch ? parseFloat(bidMatch[1]) : null;
            
            items.push({
                auctionId: auctionId,
                currentBid: currentBid,
                element: el,
                text: text.trim().substring(0, 100),
                method: 'data_attribute'
            });
        }
    });
    
    // Remove duplicates and sort by auction ID
    const uniqueItems = items.filter((item, index, self) => 
        index === self.findIndex(t => t.auctionId === item.auctionId)
    ).sort((a, b) => a.auctionId - b.auctionId);
    
    console.log(`🔍 Found ${uniqueItems.length} unique auction items:`);
    uniqueItems.forEach(item => {
        console.log(`   Auction #${item.auctionId}: ${item.currentBid ? item.currentBid.toFixed(2) + ' π' : 'No bid found'} (${item.method})`);
    });
    
    return uniqueItems;
};

// Test function with enhanced reliability
window.testBidUpdatesEnhanced = function() {
    console.log("\n🧪 ENHANCED BID UPDATE TEST");
    console.log("=".repeat(50));
    
    // Find auction items first
    const items = window.findAllAuctionItemsEnhanced();
    
    if (items.length === 0) {
        console.log("❌ No auction items found. Make sure you're on Market or My Bids view.");
        return false;
    }
    
    // Test first item
    const firstItem = items[0];
    const testData = {
        auctionId: firstItem.auctionId,
        newBid: firstItem.currentBid ? firstItem.currentBid + 5.00 : 99.99,
        bidder: "enhanced_test_bidder"
    };
    
    console.log(`\n🎯 Testing auction #${firstItem.auctionId}:`);
    console.log(`Current bid: ${firstItem.currentBid ? firstItem.currentBid.toFixed(2) : 'N/A'} π`);
    console.log(`New bid: ${testData.newBid.toFixed(2)} π`);
    
    // Use enhanced handler
    const result = window.handleBidUpdateEnhanced(testData);
    console.log(`✅ Enhanced bid update test: ${result ? 'PASSED' : 'FAILED'}`);
    
    return result;
};

// Connection monitoring
window.monitorBidConnection = function() {
    console.log("📊 Starting bid connection monitoring...");
    
    let lastUpdateTime = Date.now();
    let updateCount = 0;
    let connectionStatus = 'unknown';
    
    // Monitor bid updates
    const originalHandler = window.handleBidUpdate;
    window.handleBidUpdate = function(data) {
        lastUpdateTime = Date.now();
        updateCount++;
        console.log(`📡 Bid update #${updateCount} received at ${new Date().toLocaleTimeString()}`);
        return originalHandler ? originalHandler(data) : false;
    };
    
    // Monitor connection status
    setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        const status = timeSinceLastUpdate < 60000 ? 'connected' : 'disconnected';
        
        if (status !== connectionStatus) {
            connectionStatus = status;
            console.log(`🔔 Connection status changed: ${status}`);
            
            if (status === 'disconnected') {
                console.log(`⚠️ No bid updates for ${Math.floor(timeSinceLastUpdate / 1000)} seconds`);
            }
        }
    }, 10000); // Check every 10 seconds
    
    console.log("✅ Connection monitoring started");
};

// Make functions available globally
window.handleBidUpdateEnhanced = window.handleBidUpdateEnhanced;
window.findAllAuctionItemsEnhanced = window.findAllAuctionItemsEnhanced;
window.testBidUpdatesEnhanced = window.testBidUpdatesEnhanced;
window.monitorBidConnection = window.monitorBidConnection;

// Auto-run enhanced test after page loads
setTimeout(() => {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 ENHANCED REAL-TIME BID TEST - READY");
    console.log("=".repeat(60));
    console.log("💡 Run: window.testBidUpdatesEnhanced()");
    console.log("💡 Run: window.monitorBidConnection()");
    console.log("💡 Run: window.findAllAuctionItemsEnhanced()");
    console.log("💡 Or wait 5 seconds for auto-test...");
    
    setTimeout(() => {
        window.testBidUpdatesEnhanced();
        window.monitorBidConnection();
    }, 5000);
}, 2000);