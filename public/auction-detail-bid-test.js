/**
 * 🧪 AUCTION DETAIL BID UPDATE TEST
 * Test real-time bid updates specifically for auction detail view
 * Run this in browser console (F12) when viewing an auction detail page
 */

console.clear();
console.log("🧪 AUCTION DETAIL BID UPDATE TEST");
console.log("=".repeat(50));

// Test function for auction detail view
function testAuctionDetailBidUpdate() {
    console.log("🚀 Starting auction detail bid update test...");
    
    // Get auction ID from URL
    const urlPath = window.location.pathname;
    const auctionIdMatch = urlPath.match(/\/auction\/(\d+)/);
    
    if (!auctionIdMatch) {
        console.log("❌ Not on an auction detail page. Navigate to an auction detail page first.");
        console.log("💡 URL should be like: /auction/123");
        return false;
    }
    
    const auctionId = parseInt(auctionIdMatch[1]);
    console.log(`🎯 Testing auction #${auctionId}`);
    
    // Find bid elements on detail page
    const bidAmountElement = document.querySelector('.bid-amount[data-auction-id="' + auctionId + '"]');
    const bidCountElement = document.querySelector('.bid-count[data-auction-id="' + auctionId + '"]');
    
    console.log(`Found bid amount element: ${bidAmountElement ? '✅ YES' : '❌ NO'}`);
    console.log(`Found bid count element: ${bidCountElement ? '✅ YES' : '❌ NO'}`);
    
    if (!bidAmountElement && !bidCountElement) {
        console.log("❌ No bid elements found on this page");
        return false;
    }
    
    // Get current bid amount
    let currentBid = null;
    if (bidAmountElement) {
        const bidText = bidAmountElement.textContent || '';
        const bidMatch = bidText.match(/(\d+\.\d{2})\s*π/);
        if (bidMatch) {
            currentBid = parseFloat(bidMatch[1]);
            console.log(`📊 Current bid: ${currentBid.toFixed(2)} π`);
        }
    }
    
    // Get current bid count
    let currentCount = null;
    if (bidCountElement) {
        const countText = bidCountElement.textContent || '';
        const countMatch = countText.match(/(\d+)/);
        if (countMatch) {
            currentCount = parseInt(countMatch[1]);
            console.log(`📊 Current bid count: ${currentCount}`);
        }
    }
    
    // Test bid update
    const testBid = currentBid ? currentBid + 5.00 : 99.99;
    const testData = {
        auctionId: auctionId,
        newBid: testBid,
        bidder: "test_user_detail"
    };
    
    console.log(`🔄 Testing bid update: ${testBid.toFixed(2)} π`);
    
    // Use the handleBidUpdate function
    if (typeof window.handleBidUpdate === 'function') {
        const result = window.handleBidUpdate(testData);
        console.log(`✅ Bid update test: ${result ? 'PASSED' : 'FAILED'}`);
        return result;
    } else {
        console.log("❌ handleBidUpdate function not found");
        return false;
    }
}

// Test server-side emission for detail page
async function testServerEmissionForDetail() {
    console.log("\n🌐 Testing server-side bid emission for detail page...");
    
    const urlPath = window.location.pathname;
    const auctionIdMatch = urlPath.match(/\/auction\/(\d+)/);
    
    if (!auctionIdMatch) {
        console.log("❌ Not on an auction detail page");
        return false;
    }
    
    const auctionId = parseInt(auctionIdMatch[1]);
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/http-poll?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auctionId: auctionId,
                newBid: 123.45,
                bidder: "server_test_detail",
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            console.log("✅ Server responded successfully for detail page");
            const data = await response.json();
            console.log("📋 Response data:", data);
            return true;
        } else {
            console.log("❌ Server error for detail page:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error testing server emission for detail page:", error);
        return false;
    }
}

// Check if we're on auction detail page
function checkAuctionDetailPage() {
    const urlPath = window.location.pathname;
    const auctionIdMatch = urlPath.match(/\/auction\/(\d+)/);
    
    if (auctionIdMatch) {
        const auctionId = parseInt(auctionIdMatch[1]);
        console.log(`✅ On auction detail page #${auctionId}`);
        return true;
    } else {
        console.log("⚠️ Not on an auction detail page");
        return false;
    }
}

// Main test function
function runDetailPageTest() {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 AUCTION DETAIL BID UPDATE TEST - STARTING");
    console.log("=".repeat(50));
    
    if (!checkAuctionDetailPage()) {
        console.log("\n💡 Navigate to an auction detail page and run this test again.");
        return;
    }
    
    // Test 1: Client-side bid update
    const clientResult = testAuctionDetailBidUpdate();
    
    // Test 2: Server-side emission
    testServerEmissionForDetail().then(serverResult => {
        console.log("\n📊 Test Results for Auction Detail Page:");
        console.log(`Client Bid Update: ${clientResult ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Server Emission: ${serverResult ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (clientResult && serverResult) {
            console.log("\n🎉 ALL TESTS PASSED! Real-time bidding works on auction detail page!");
            console.log("💡 Try placing a real bid to see the full flow in action.");
        } else {
            console.log("\n⚠️ Some tests failed. Check the console for details.");
        }
    });
}

// Make functions available globally
window.testAuctionDetailBidUpdate = testAuctionDetailBidUpdate;
window.testServerEmissionForDetail = testServerEmissionForDetail;
window.runDetailPageTest = runDetailPageTest;

// Auto-run test after page loads
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 AUCTION DETAIL BID UPDATE TEST - READY");
    console.log("=".repeat(50));
    console.log("💡 Run: window.runDetailPageTest()");
    console.log("💡 Or wait 3 seconds for auto-test...");
    
    setTimeout(runDetailPageTest, 3000);
}, 2000);