/**
 * 🧪 COMPREHENSIVE BID UPDATE TEST
 * Tests the complete bid update flow with CSS classes
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🧪 COMPREHENSIVE BID UPDATE TEST");
console.log("=".repeat(50));

// Test function to find all bid amount elements
function findBidAmountElements() {
    console.log("\n🔍 Finding all bid amount elements...");
    
    const elements = [];
    
    // Method 1: Find by CSS class
    const classElements = document.querySelectorAll('.bid-amount');
    classElements.forEach(el => {
        const auctionId = el.getAttribute('data-auction-id');
        const text = el.textContent || '';
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch && auctionId) {
            elements.push({
                element: el,
                auctionId: parseInt(auctionId),
                currentBid: parseFloat(bidMatch[1]),
                method: 'css_class'
            });
            console.log(`✅ Found bid element by class: Auction #${auctionId} - ${bidMatch[1]} π`);
        }
    });
    
    // Method 2: Find by data attribute
    const dataElements = document.querySelectorAll('[data-auction-id]');
    dataElements.forEach(el => {
        const auctionId = el.getAttribute('data-auction-id');
        const text = el.textContent || '';
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch && auctionId && !elements.some(e => e.element === el)) {
            elements.push({
                element: el,
                auctionId: parseInt(auctionId),
                currentBid: parseFloat(bidMatch[1]),
                method: 'data_attribute'
            });
            console.log(`✅ Found bid element by data attribute: Auction #${auctionId} - ${bidMatch[1]} π`);
        }
    });
    
    console.log(`📊 Found ${elements.length} bid amount elements`);
    return elements;
}

// Enhanced bid update handler
window.handleBidUpdate = function(data) {
    console.log("\n🎯 BID UPDATE RECEIVED:", data);
    
    if (!data || !data.auctionId || !data.newBid) {
        console.error("❌ Invalid bid update data:", data);
        return false;
    }
    
    const { auctionId, newBid, bidder } = data;
    let updatedCount = 0;
    
    // Method 1: Update by CSS class (most reliable)
    const classElements = document.querySelectorAll(`.bid-amount[data-auction-id="${auctionId}"]`);
    classElements.forEach(el => {
        const currentText = el.textContent || '';
        const newText = currentText.replace(/\d+\.\d{2}/, Number(newBid).toFixed(2));
        el.textContent = newText;
        
        // Add visual feedback
        el.classList.add('bid-updated');
        setTimeout(() => el.classList.remove('bid-updated'), 1000);
        
        updatedCount++;
        console.log(`✅ Updated bid by class: "${currentText}" → "${newText}"`);
    });
    
    // Method 2: Update by data attribute (fallback)
    if (updatedCount === 0) {
        const dataElements = document.querySelectorAll(`[data-auction-id="${auctionId}"]`);
        dataElements.forEach(el => {
            const text = el.textContent || '';
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            
            if (bidMatch) {
                const newText = text.replace(bidMatch[0], `${Number(newBid).toFixed(2)} π`);
                el.textContent = newText;
                
                // Add visual feedback
                el.classList.add('bid-updated');
                setTimeout(() => el.classList.remove('bid-updated'), 1000);
                
                updatedCount++;
                console.log(`✅ Updated bid by data attribute: "${text}" → "${newText}"`);
            }
        });
    }
    
    // Method 3: Update React state if available
    if (window.updateReactAuctionItem) {
        window.updateReactAuctionItem(auctionId, newBid, bidder);
        updatedCount++;
        console.log(`✅ Updated React state`);
    }
    
    // Also update the existing React handler for consistency
    if (typeof window.originalHandleBidUpdate === 'function') {
        window.originalHandleBidUpdate(data);
    }
    
    if (updatedCount > 0) {
        console.log(`🎉 Successfully updated ${updatedCount} element(s) for auction #${auctionId}`);
        return true;
    } else {
        console.warn(`⚠️ No bid elements found for auction #${auctionId}`);
        return false;
    }
};

// Test function to simulate bid updates
window.testBidUpdates = function() {
    console.log("\n🧪 TESTING BID UPDATES");
    console.log("=".repeat(30));
    
    // Find all bid elements
    const elements = findBidAmountElements();
    
    if (elements.length === 0) {
        console.log("❌ No bid elements found. Make sure auction items are loaded.");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load items.");
        return false;
    }
    
    console.log("\n🎯 Testing bid updates on found elements...");
    
    // Test each element
    elements.forEach((element, index) => {
        setTimeout(() => {
            const newBid = element.currentBid + Math.random() * 10 + 1;
            const testData = {
                auctionId: element.auctionId,
                newBid: newBid,
                bidder: `test_bidder_${index + 1}`
            };
            
            console.log(`\n🔄 Test ${index + 1}: Auction #${element.auctionId}`);
            console.log(`   Current: ${element.currentBid.toFixed(2)} π`);
            console.log(`   New:     ${newBid.toFixed(2)} π`);
            
            const success = window.handleBidUpdate(testData);
            
            if (success) {
                element.currentBid = newBid; // Update tracked value
                console.log(`   ✅ Success!`);
            } else {
                console.log(`   ❌ Failed!`);
            }
        }, index * 1000); // Stagger tests by 1 second
    });
    
    console.log(`\n📈 Scheduled ${elements.length} test bid updates`);
    return true;
};

// Test server-side bid emission
window.testServerBidEmission = async function() {
    console.log("\n🌐 TESTING SERVER-SIDE BID EMISSION");
    console.log("=".repeat(40));
    
    try {
        const baseUrl = window.location.origin;
        console.log(`📍 Using base URL: ${baseUrl}`);
        
        // Find a test auction
        const elements = findBidAmountElements();
        if (elements.length === 0) {
            console.log("❌ No auction elements found for testing");
            return false;
        }
        
        const testElement = elements[0];
        const newBid = testElement.currentBid + 5.00;
        
        console.log(`🎯 Testing with Auction #${testElement.auctionId}`);
        console.log(`   Current bid: ${testElement.currentBid.toFixed(2)} π`);
        console.log(`   Test bid:    ${newBid.toFixed(2)} π`);
        
        // Test the HTTP polling endpoint
        const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auctionId: testElement.auctionId,
                newBid: newBid,
                bidder: "server_test_user",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            console.log("✅ Server bid update endpoint responded successfully");
            const data = await response.json();
            console.log("📋 Response data:", data);
            
            // Check if UI updated (should happen via HTTP polling)
            setTimeout(() => {
                const updatedElements = document.querySelectorAll(`[data-auction-id="${testElement.auctionId}"]`);
                const currentText = updatedElements[0]?.textContent || '';
                const bidMatch = currentText.match(/(\d+\.\d{2})\s*π/);
                
                if (bidMatch && parseFloat(bidMatch[1]) === newBid) {
                    console.log("🎉 UI updated successfully!");
                } else {
                    console.log("⚠️ UI may not have updated yet. Check again in a few seconds.");
                }
            }, 2000); // Wait 2 seconds for polling
            
            return true;
        } else {
            console.log("❌ Server bid update endpoint failed:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error testing server bid update:", error);
        return false;
    }
};

// Initialize
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 COMPREHENSIVE BID UPDATE TEST - READY");
    console.log("=".repeat(50));
    
    // Find initial elements
    const elements = findBidAmountElements();
    
    if (elements.length > 0) {
        console.log(`\n✅ Found ${elements.length} bid elements. Ready for testing!`);
        console.log("\n💡 Available test functions:");
        console.log("   window.testBidUpdates() - Run automated bid update tests");
        console.log("   window.testServerBidEmission() - Test server-side emission");
        console.log("   window.handleBidUpdate(data) - Manual bid update");
        console.log("   window.findBidAmountElements() - Find all bid elements");
        
        // Auto-run a quick test
        console.log("\n🚀 Running quick test in 2 seconds...");
        setTimeout(() => {
            window.testBidUpdates();
        }, 2000);
        
    } else {
        console.log("\n⚠️ No bid elements found. Make sure you're on the Market or My Bids view.");
        console.log("💡 Try clicking 'Market' or 'My Bids' to load auction items.");
        console.log("💡 Then run: window.testBidUpdates()");
    }
    
}, 3000); // Wait 3 seconds for page to load