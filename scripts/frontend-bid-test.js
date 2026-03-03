// LIVE FRONTEND BID UPDATE TEST
console.log("🎯 LIVE FRONTEND BID UPDATE TEST");
console.log("=".repeat(70));
console.log("Testing real bid updates in the actual browser UI");
console.log("=".repeat(70));

const NGROK_URL = "https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev";
const TEST_AUCTION_ID = 3330; // Using the auction ID from the logs
const TEST_BID_AMOUNT = 777.77;
const TEST_BIDDER = "frontend_test_user";

// Monitor the actual browser UI for changes
function monitorUIChanges() {
    console.log("🔍 Monitoring browser UI for bid update changes...");
    
    // Look for bid-related elements
    const bidElements = document.querySelectorAll('[data-auction-id], .current-bid, .bid-amount, .highest-bid');
    console.log(`📊 Found ${bidElements.length} potential bid display elements`);
    
    bidElements.forEach((el, i) => {
        const auctionId = el.getAttribute('data-auction-id');
        const currentText = el.textContent;
        const currentValue = parseFloat(currentText.replace(/[^\d.]/g, ''));
        
        console.log(`  Element ${i}:`);
        console.log(`    Auction ID: ${auctionId || 'unknown'}`);
        console.log(`    Current Text: "${currentText}"`);
        console.log(`    Current Value: ${currentValue || 'N/A'}`);
        console.log(`    Element: ${el.tagName} (${el.className})`);
        
        // Store original values for comparison
        el.setAttribute('data-original-text', currentText);
        el.setAttribute('data-original-value', currentValue.toString());
    });
    
    return bidElements;
}

// Check for React state or component updates
function checkReactUpdates() {
    console.log("🔍 Checking for React component updates...");
    
    // Look for React DevTools or component indicators
    const reactRoots = document.querySelectorAll('[data-reactroot], #__next, [data-testid]');
    console.log(`📊 Found ${reactRoots.length} React root elements`);
    
    // Monitor specific auction items
    const auctionItems = document.querySelectorAll('.auction-item, [data-auction-id]');
    console.log(`📊 Found ${auctionItems.length} auction items`);
    
    auctionItems.forEach((item, i) => {
        const auctionId = item.getAttribute('data-auction-id');
        const bidElements = item.querySelectorAll('.bid, .price, .amount');
        
        console.log(`  Auction Item ${i}:`);
        console.log(`    Auction ID: ${auctionId || 'unknown'}`);
        console.log(`    Bid Elements: ${bidElements.length}`);
        
        bidElements.forEach((bidEl, j) => {
            console.log(`      Bid Element ${j}: "${bidEl.textContent}"`);
        });
    });
    
    return auctionItems;
}

// Send a real bid update through the API
async function sendRealBidUpdate() {
    console.log(`\n💸 Sending real bid update: ${TEST_BID_AMOUNT}π by ${TEST_BIDDER}`);
    console.log(`🎯 Target Auction: ${TEST_AUCTION_ID}`);
    
    try {
        const response = await fetch(`${NGROK_URL}/api/http-poll?action=update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: TEST_AUCTION_ID,
                newBid: TEST_BID_AMOUNT,
                bidder: TEST_BIDDER,
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bid update sent successfully!`);
            console.log(`📡 Server Response:`, result);
            return true;
        } else {
            console.log(`❌ Bid update failed: ${response.status}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error sending bid update:`, error.message);
        return false;
    }
}

// Check if bid update was received and processed
function checkForBidUpdate() {
    console.log("\n🔍 Checking if bid update was received...");
    
    // Check all monitored elements
    const bidElements = document.querySelectorAll('[data-original-text]');
    let updatesFound = 0;
    
    bidElements.forEach((el, i) => {
        const originalText = el.getAttribute('data-original-text');
        const originalValue = parseFloat(el.getAttribute('data-original-value') || '0');
        const currentText = el.textContent;
        const currentValue = parseFloat(currentText.replace(/[^\d.]/g, ''));
        
        if (currentText !== originalText) {
            updatesFound++;
            console.log(`🎯 UPDATE DETECTED in Element ${i}:`);
            console.log(`    Original: "${originalText}"`);
            console.log(`    Current:  "${currentText}"`);
            console.log(`    Value Changed: ${originalValue} → ${currentValue}`);
        }
    });
    
    if (updatesFound === 0) {
        console.log("❌ No bid update detected in UI elements");
    } else {
        console.log(`✅ Found ${updatesFound} UI updates!`);
    }
    
    return updatesFound;
}

// Check browser console for bid update logs
function checkBrowserLogs() {
    console.log("\n🔍 Checking browser console logs...");
    
    // Look for any bid-related logs that might have been printed
    const allLogs = [];
    
    // Check if handleBidUpdate was called
    if (window.handleBidUpdate) {
        console.log("✅ handleBidUpdate function exists on window");
    } else {
        console.log("❌ handleBidUpdate function NOT found on window");
    }
    
    // Check for WebSocket connection status
    const connectionStatus = document.querySelector('[data-connection-status]');
    if (connectionStatus) {
        console.log(`📡 Connection Status: "${connectionStatus.textContent}"`);
    }
    
    // Check for transport type
    const transportElement = document.querySelector('[data-transport]');
    if (transportElement) {
        console.log(`🚗 Transport: "${transportElement.textContent}"`);
    }
}

// Main test function
async function runFrontendBidTest() {
    console.log("🚀 Starting frontend bid update test...");
    
    // Step 1: Monitor current UI state
    console.log("\n" + "=".repeat(50));
    console.log("STEP 1: Monitoring current UI state");
    console.log("=".repeat(50));
    
    const monitoredElements = monitorUIChanges();
    const auctionItems = checkReactUpdates();
    checkBrowserLogs();
    
    // Step 2: Send bid update
    console.log("\n" + "=".repeat(50));
    console.log("STEP 2: Sending bid update");
    console.log("=".repeat(50));
    
    const bidSuccess = await sendRealBidUpdate();
    
    if (!bidSuccess) {
        console.log("❌ Bid update failed - cannot proceed with test");
        return;
    }
    
    // Step 3: Wait for update to propagate
    console.log("\n" + "=".repeat(50));
    console.log("STEP 3: Waiting for update to propagate (5 seconds)");
    console.log("=".repeat(50));
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Check for updates
    console.log("\n" + "=".repeat(50));
    console.log("STEP 4: Checking for bid update in UI");
    console.log("=".repeat(50));
    
    const updatesFound = checkForBidUpdate();
    
    // Final summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 FRONTEND BID UPDATE TEST COMPLETE");
    console.log("=".repeat(70));
    
    if (updatesFound > 0) {
        console.log("✅ SUCCESS: Bid updates are appearing in the browser UI!");
        console.log(`   Found ${updatesFound} UI elements updated`);
        console.log("🚀 Real-time functionality is working correctly!");
    } else {
        console.log("❌ ISSUE: Bid updates are NOT appearing in the browser UI");
        console.log("🔍 Check the console logs above for debugging information");
        console.log("💡 The issue might be in the React component update logic");
    }
}

// Export test function to window for manual testing
window.runFrontendBidTest = runFrontendBidTest;
window.testBidUpdate = function(auctionId, amount, bidder) {
    console.log(`🧪 Testing bid update: Auction ${auctionId}, ${amount}π by ${bidder}`);
    
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: auctionId,
            newBid: amount,
            bidder: bidder
        });
        console.log("✅ Called handleBidUpdate directly");
    } else {
        console.log("❌ handleBidUpdate not found");
    }
};

// Auto-start the test after 3 seconds
setTimeout(() => {
    console.log("🚀 Auto-starting frontend bid test...");
    runFrontendBidTest();
}, 3000);

console.log("✅ Frontend bid test script loaded!");
console.log("💡 Run window.runFrontendBidTest() to test manually");
console.log("💡 Run window.testBidUpdate(3330, 999.99, 'test_user') to test specific bid");