// SIMPLE FRONTEND BID UPDATE TEST
console.log("🎯 SIMPLE FRONTEND BID UPDATE TEST");
console.log("=".repeat(70));

const NGROK_URL = "https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev";
const TEST_AUCTION_ID = 3330;
const TEST_BID_AMOUNT = 888.88;
const TEST_BIDDER = "frontend_test";

// Simple test function
async function testFrontendBidUpdate() {
    console.log("🚀 Testing frontend bid update...");
    
    // Step 1: Check current state
    console.log("\n📊 Current State Check:");
    
    // Check connection status
    const statusElement = document.querySelector('[data-connection-status]');
    if (statusElement) {
        console.log(`📡 Connection: ${statusElement.textContent}`);
    }
    
    // Check transport
    const transportElement = document.querySelector('[data-transport]');
    if (transportElement) {
        console.log(`🚗 Transport: ${transportElement.textContent}`);
    }
    
    // Check for auction elements
    const auctionElements = document.querySelectorAll('[data-auction-id]');
    console.log(`🏷️  Found ${auctionElements.length} auction elements`);
    
    // Look for current bid displays
    const bidElements = document.querySelectorAll('.current-bid, .bid-amount, .highest-bid, .price');
    console.log(`💰 Found ${bidElements.length} bid display elements`);
    
    bidElements.forEach((el, i) => {
        console.log(`  Bid Element ${i}: "${el.textContent.trim()}"`);
    });
    
    // Step 2: Send bid update
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
                auctionId: TEST_AUCTION_ID,
                newBid: TEST_BID_AMOUNT,
                bidder: TEST_BIDDER,
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bid update sent: ${TEST_BID_AMOUNT}π by ${TEST_BIDDER}`);
            console.log(`📡 Server response: ${result.message}`);
        } else {
            console.log(`❌ Bid update failed: ${response.status}`);
            return;
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }
    
    // Step 3: Wait and check for changes
    console.log("\n⏱️  Waiting 3 seconds for update to appear...");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Check for changes
    console.log("\n🔍 Checking for bid update in UI...");
    
    const updatedBidElements = document.querySelectorAll('.current-bid, .bid-amount, .highest-bid, .price');
    let foundUpdate = false;
    
    updatedBidElements.forEach((el, i) => {
        const currentText = el.textContent.trim();
        if (currentText.includes(TEST_BID_AMOUNT.toString()) || currentText.includes(TEST_BIDDER)) {
            foundUpdate = true;
            console.log(`🎯 UPDATE FOUND in Element ${i}: "${currentText}"`);
        }
    });
    
    // Step 5: Test direct function call
    console.log("\n🧪 Testing direct handleBidUpdate call...");
    
    if (window.handleBidUpdate) {
        console.log("✅ handleBidUpdate function found");
        
        // Test with a visible auction
        const visibleAuction = document.querySelector('[data-auction-id]');
        if (visibleAuction) {
            const auctionId = visibleAuction.getAttribute('data-auction-id');
            console.log(`🎯 Testing with visible auction #${auctionId}`);
            
            window.handleBidUpdate({
                auctionId: parseInt(auctionId),
                newBid: 999.99,
                bidder: "direct_test"
            });
            
            console.log("✅ Called handleBidUpdate directly");
        } else {
            console.log("❌ No visible auction found");
        }
        
    } else {
        console.log("❌ handleBidUpdate function not found");
    }
    
    // Final result
    console.log("\n" + "=".repeat(70));
    console.log("🎯 TEST RESULT:");
    
    if (foundUpdate) {
        console.log("✅ SUCCESS: Bid updates are appearing in the browser UI!");
        console.log("🚀 Real-time functionality is working correctly!");
    } else {
        console.log("❌ ISSUE: Bid updates are NOT appearing in the browser UI");
        console.log("🔍 Check console logs above for debugging information");
    }
    
    console.log("=".repeat(70));
}

// Export to window
window.testFrontendBidUpdate = testFrontendBidUpdate;

// Auto-run after 2 seconds
setTimeout(() => {
    console.log("🚀 Auto-starting frontend bid update test...");
    testFrontendBidUpdate();
}, 2000);

console.log("✅ Simple frontend test loaded!");
console.log("💡 Run window.testFrontendBidUpdate() to test manually");