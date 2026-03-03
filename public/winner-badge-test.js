/**
 * 🧪 WINNER BADGE TEST - Test the "Winning" to "Winner" badge change
 * Run this in browser console (F12) when viewing My Bids view
 * This test simulates different auction states to verify badge changes
 */

console.clear();
console.log("🧪 WINNER BADGE TEST - STARTING");
console.log("=".repeat(50));

// Test function to check badge text
function testWinnerBadge() {
    console.log("🚀 Testing Winner Badge functionality...");
    
    // Find all auction items in My Bids view
    const auctionItems = document.querySelectorAll('[data-auction-id]');
    console.log(`📊 Found ${auctionItems.length} auction items with data-auction-id attributes`);
    
    if (auctionItems.length === 0) {
        console.log("❌ No auction items found. Make sure you're on My Bids view.");
        return false;
    }
    
    let testResults = [];
    
    auctionItems.forEach((item, index) => {
        const auctionId = item.getAttribute('data-auction-id');
        console.log(`\n🔍 Testing item #${index + 1} (Auction #${auctionId})`);
        
        // Find the badge element
        const badgeElement = item.querySelector('.bg-green-500, .bg-green-600');
        if (!badgeElement) {
            console.log(`⚠️  No winning badge found for auction #${auctionId}`);
            return;
        }
        
        const badgeText = badgeElement.textContent?.trim();
        console.log(`   Badge text: "${badgeText}"`);
        
        // Check if auction is over (look for CLOSED status or expired date)
        const statusElement = item.querySelector('[data-auction-status]') || 
                             item.querySelector('.text-gray-500') ||
                             item.querySelector('.text-red-500');
        
        const isAuctionOver = statusElement && (
            statusElement.textContent?.includes('CLOSED') ||
            statusElement.textContent?.includes('ENDED') ||
            statusElement.textContent?.includes('EXPIRED')
        );
        
        console.log(`   Auction status: ${isAuctionOver ? 'CLOSED/ENDED' : 'OPEN'}`);
        
        // Test the expected behavior
        if (badgeText === "Winning") {
            if (isAuctionOver) {
                console.log(`❌ ISSUE: Badge shows "Winning" but auction is over - should show "Winner"`);
                testResults.push({ auctionId, issue: 'Should show "Winner" when auction is over', current: badgeText });
            } else {
                console.log(`✅ CORRECT: Badge shows "Winning" for active auction`);
                testResults.push({ auctionId, status: 'correct', current: badgeText });
            }
        } else if (badgeText.includes("Trophy") || badgeText === "Winner") {
            if (isAuctionOver) {
                console.log(`✅ CORRECT: Badge shows Gold Trophy icon for ended auction`);
                testResults.push({ auctionId, status: 'correct', current: badgeText });
            } else {
                console.log(`❌ ISSUE: Badge shows Gold Trophy but auction is still active - should show "Winning"`);
                testResults.push({ auctionId, issue: 'Should show "Winning" when auction is active', current: badgeText });
            }
        } else {
            console.log(`ℹ️  Other badge text: "${badgeText}"`);
            testResults.push({ auctionId, status: 'other', current: badgeText });
        }
    });
    
    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 WINNER BADGE TEST RESULTS");
    console.log("=".repeat(50));
    
    const issues = testResults.filter(r => r.issue);
    const correct = testResults.filter(r => r.status === 'correct');
    
    console.log(`Total items tested: ${testResults.length}`);
    console.log(`✅ Correct badges: ${correct.length}`);
    console.log(`❌ Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
        console.log("\n🚨 ISSUES TO FIX:");
        issues.forEach(issue => {
            console.log(`   Auction #${issue.auctionId}: ${issue.issue} (current: "${issue.current}")`);
        });
        return false;
    } else {
        console.log("\n🎉 ALL BADGES ARE CORRECT!");
        return true;
    }
}

// Test function to simulate auction state changes
function simulateAuctionEnd() {
    console.log("\n🔄 Simulating auction end...");
    
    // Find all winning badges
    const winningBadges = document.querySelectorAll('.bg-green-500, .bg-yellow-500');
    
    winningBadges.forEach((badge, index) => {
        const originalText = badge.textContent?.trim();
        console.log(`   Badge #${index + 1}: "${originalText}" -> Gold Trophy icon`);
        
        // Temporarily change to Gold Trophy icon for testing
        badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-300"><path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20.38C20.77 4 21.08 4.35 21.03 4.74L20.3 11.32C20.12 12.68 19.08 13.77 17.73 13.95C17.28 14.01 16.85 14 16.43 13.95C15.38 13.85 14.5 13.21 14.08 12.25L12.86 9.88L11.64 12.25C11.22 13.21 10.34 13.85 9.29 13.95C8.87 14 8.44 14.01 7.99 13.95C6.64 13.77 5.6 12.68 5.42 11.32L4.69 4.74C4.64 4.35 4.95 4 5.34 4H7ZM9 4H15V2H9V4ZM9 21C8.45 21 8 20.55 8 20C8 19.45 8.45 19 9 19H15C15.55 19 16 19.45 16 20C16 20.55 15.55 21 15 21H9Z"/></svg> Winner';
        
        // Change back after 2 seconds
        setTimeout(() => {
            badge.textContent = originalText;
            console.log(`   Restored badge #${index + 1}: "${originalText}"`);
        }, 2000);
    });
    
    console.log("✅ Simulation complete - check badges changed to Gold Trophy icon for 2 seconds");
}

// Test function to check auction status
function checkAuctionStatuses() {
    console.log("\n🔍 Checking auction statuses...");
    
    const auctionItems = document.querySelectorAll('[data-auction-id]');
    
    auctionItems.forEach((item, index) => {
        const auctionId = item.getAttribute('data-auction-id');
        
        // Look for status indicators
        const statusText = item.textContent || '';
        const isOpen = statusText.includes('OPEN') || statusText.includes('ACTIVE');
        const isClosed = statusText.includes('CLOSED') || statusText.includes('ENDED') || statusText.includes('EXPIRED');
        
        console.log(`   Auction #${auctionId}: ${isOpen ? 'OPEN' : isClosed ? 'CLOSED' : 'UNKNOWN'}`);
    });
}

// Main test function
function runWinnerBadgeTest() {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 WINNER BADGE TEST - STARTING");
    console.log("=".repeat(50));
    
    // Check if we're on My Bids view
    const isMyBidsView = window.location.pathname.includes('my-bids') || 
                        document.querySelector('.my-bids') !== null ||
                        document.title.includes('My Bids');
    
    if (!isMyBidsView) {
        console.log("⚠️  Not on My Bids view. Navigate to My Bids to test winner badges.");
        console.log("💡 Current URL:", window.location.href);
        return;
    }
    
    console.log("✅ Confirmed on My Bids view");
    
    // Run tests
    const statusTest = checkAuctionStatuses();
    const badgeTest = testWinnerBadge();
    
    // Offer simulation option
    console.log("\n💡 Test Options:");
    console.log("   1. Run: simulateAuctionEnd() - Temporarily change badges to 'Winner'");
    console.log("   2. Run: checkAuctionStatuses() - Check all auction statuses");
    console.log("   3. Run: testWinnerBadge() - Test badge logic again");
    
    return badgeTest;
}

// Make functions available globally
window.testWinnerBadge = testWinnerBadge;
window.simulateAuctionEnd = simulateAuctionEnd;
window.checkAuctionStatuses = checkAuctionStatuses;
window.runWinnerBadgeTest = runWinnerBadgeTest;

// Auto-run test after page loads
setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🧪 WINNER BADGE TEST - READY");
    console.log("=".repeat(50));
    console.log("💡 Run: window.runWinnerBadgeTest()");
    console.log("💡 Or wait 3 seconds for auto-test...");
    
    setTimeout(runWinnerBadgeTest, 3000);
}, 2000);