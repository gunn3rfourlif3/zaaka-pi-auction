// 🔍 COMPREHENSIVE AUCTION DEBUGGING SCRIPT
// This script helps identify why auctions aren't showing in the market tab

console.log("� AUCTION MARKET DISPLAY DEBUGGER");
console.log("==================================");

// Test configuration
const TEST_CONFIG = {
  sellerId: "debug_user",
  title: "Debug Test Auction",
  description: "Testing market display functionality",
  price: "2.5",
  category: "General",
  durationMinutes: 15,
  imageUrl: "https://via.placeholder.com/300x200?text=Debug+Auction"
};

// Debug logging function
function logSection(title) {
  console.log(`\n📍 ${title}`);
  console.log("-".repeat(50));
}

// Test 1: Create auction with detailed logging
async function createTestAuction() {
  logSection("CREATING TEST AUCTION");
  
  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + TEST_CONFIG.durationMinutes);
  
  const auctionData = {
    title: TEST_CONFIG.title,
    description: TEST_CONFIG.description,
    price: TEST_CONFIG.price,
    category: TEST_CONFIG.category,
    sellerId: TEST_CONFIG.sellerId,
    imageUrls: [TEST_CONFIG.imageUrl],
    expiresAt: expirationDate.toISOString()
  };

  console.log("📤 Request Data:");
  console.log(JSON.stringify(auctionData, null, 2));

  try {
    const response = await fetch('/api/auctions/create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(auctionData)
    });

    console.log(`\n📊 Response Status: ${response.status}`);
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Auction created successfully!");
      console.log("📋 Created Auction Details:");
      console.log(`   ID: ${result.id}`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Seller: ${result.seller_id}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Current Bid: ${result.currentBid}π`);
      console.log(`   Expires: ${new Date(result.expires_at).toLocaleString()}`);
      console.log(`   Images: ${result.images?.length || 0}`);
      console.log(`   Bids Count: ${result._count?.bids || 0}`);
      
      return result;
    } else {
      console.log("❌ Auction creation failed!");
      console.log("Error Details:", result);
      return null;
    }
  } catch (error) {
    console.log("❌ Network/Server Error:", error);
    return null;
  }
}

// Test 2: Fetch and analyze live auctions
async function fetchLiveAuctions() {
  logSection("FETCHING LIVE AUCTIONS");
  
  try {
    const response = await fetch('/api/auctions/live', {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    console.log(`📊 Response Status: ${response.status}`);
    const auctions = await response.json();
    
    console.log(`� Total Auctions Returned: ${auctions.length}`);
    
    if (auctions.length === 0) {
      console.log("⚠️  No auctions found in live API!");
      return [];
    }

    // Analyze auction statuses
    const statusAnalysis = {};
    const categoryAnalysis = {};
    const sellerAnalysis = {};
    
    auctions.forEach(auction => {
      // Status analysis
      statusAnalysis[auction.status] = (statusAnalysis[auction.status] || 0) + 1;
      
      // Category analysis
      categoryAnalysis[auction.category] = (categoryAnalysis[auction.category] || 0) + 1;
      
      // Seller analysis
      sellerAnalysis[auction.seller_id] = (sellerAnalysis[auction.seller_id] || 0) + 1;
    });

    console.log("\n📊 Status Distribution:");
    Object.entries(statusAnalysis).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} auctions`);
    });

    console.log("\n📊 Category Distribution:");
    Object.entries(categoryAnalysis).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} auctions`);
    });

    console.log("\n📊 Top Sellers:");
    const topSellers = Object.entries(sellerAnalysis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    topSellers.forEach(([seller, count]) => {
      console.log(`   ${seller}: ${count} auctions`);
    });

    // Show first few auctions
    console.log("\n🏆 Sample Auctions:");
    auctions.slice(0, 3).forEach((auction, index) => {
      const isExpired = new Date(auction.expires_at).getTime() <= Date.now();
      console.log(`${index + 1}. "${auction.title}"`);
      console.log(`   ID: ${auction.id} | Status: ${auction.status} | Expired: ${isExpired}`);
      console.log(`   Seller: ${auction.seller_id} | Category: ${auction.category}`);
      console.log(`   Current Bid: ${auction.currentBid}π | Expires: ${new Date(auction.expires_at).toLocaleString()}`);
      console.log("");
    });

    return auctions;
  } catch (error) {
    console.log("❌ Network/Server Error:", error);
    return [];
  }
}

// Test 3: Check market view filtering logic
function checkMarketFiltering(auction, currentUser = null) {
  logSection("MARKET VIEW FILTERING ANALYSIS");
  
  const now = Date.now();
  const username = currentUser?.username?.replace('@', '') || TEST_CONFIG.sellerId;
  
  console.log("🔍 Analyzing auction for market view...");
  console.log(`   Auction ID: ${auction.id}`);
  console.log(`   Title: ${auction.title}`);
  console.log(`   Status: ${auction.status}`);
  console.log(`   Seller: ${auction.seller_id}`);
  console.log(`   Category: ${auction.category}`);
  console.log(`   Current Bid: ${auction.currentBid}π`);
  console.log(`   Expires: ${new Date(auction.expires_at).toLocaleString()}`);
  
  const isExpired = new Date(auction.expires_at).getTime() <= now;
  const isSeller = username === auction.seller_id;
  const isClosed = auction.status === 'CLOSED' || isExpired;
  
  console.log(`\n📊 Filter Conditions:`);
  console.log(`   Is Expired: ${isExpired}`);
  console.log(`   Is Seller: ${isSeller}`);
  console.log(`   Is Closed: ${isClosed}`);
  console.log(`   Status === 'OPEN': ${auction.status === 'OPEN'}`);
  
  // Market view filtering logic
  const shouldShowInMarket = auction.status === 'OPEN' && !isExpired;
  
  console.log(`\n🎯 Market View Result: ${shouldShowInMarket ? '✅ WILL SHOW' : '❌ WILL NOT SHOW'}`);
  
  if (!shouldShowInMarket) {
    console.log("\n⚠️  Reasons for not showing:");
    if (auction.status !== 'OPEN') {
      console.log(`   - Status is "${auction.status}" (must be "OPEN")`);
    }
    if (isExpired) {
      console.log(`   - Auction has expired`);
    }
  }
  
  return shouldShowInMarket;
}

// Test 4: Check inventory view filtering
function checkInventoryFiltering(auction, currentUser = null) {
  logSection("INVENTORY VIEW FILTERING ANALYSIS");
  
  const username = currentUser?.username?.replace('@', '') || TEST_CONFIG.sellerId;
  const isSeller = username === auction.seller_id;
  const isExpired = new Date(auction.expires_at).getTime() <= Date.now();
  const isClosed = auction.status === 'CLOSED' || isExpired;
  
  // Inventory view filtering logic
  const shouldShowInInventory = isSeller && (!isClosed || !auction.delivered);
  
  console.log(`🔍 Analyzing auction for inventory view...`);
  console.log(`   Is Seller: ${isSeller}`);
  console.log(`   Is Closed: ${isClosed}`);
  console.log(`   Is Delivered: ${auction.delivered || false}`);
  console.log(`\n🎯 Inventory View Result: ${shouldShowInInventory ? '✅ WILL SHOW' : '❌ WILL NOT SHOW'}`);
  
  return shouldShowInInventory;
}

// Main debug function
async function runComprehensiveDebug() {
  console.log("🚀 Starting Comprehensive Auction Debug...\n");
  
  // Test 1: Create auction
  const createdAuction = await createTestAuction();
  
  if (!createdAuction) {
    console.log("\n❌ Cannot proceed - auction creation failed!");
    return;
  }
  
  // Test 2: Fetch live auctions
  const liveAuctions = await fetchLiveAuctions();
  
  // Test 3: Check if our auction appears in live auctions
  logSection("AUCTION VISIBILITY CHECK");
  const foundAuction = liveAuctions.find(a => a.id === createdAuction.id);
  
  if (foundAuction) {
    console.log("✅ Created auction found in live auctions API!");
  } else {
    console.log("❌ Created auction NOT found in live auctions API!");
    console.log("\n🔍 This suggests the issue is in the API or database layer.");
  }
  
  // Test 4: Analyze filtering logic
  const marketResult = checkMarketFiltering(createdAuction);
  const inventoryResult = checkInventoryFiltering(createdAuction);
  
  // Test 5: Provide recommendations
  logSection("RECOMMENDATIONS");
  
  if (!foundAuction) {
    console.log("🔧 API/Database Issues:");
    console.log("   1. Check server logs for errors during auction creation");
    console.log("   2. Verify database connection and auction record insertion");
    console.log("   3. Check if auctions are being filtered out in the backend API");
    console.log("   4. Verify Prisma client is working correctly");
  } else if (!marketResult) {
    console.log("🔧 Frontend Filtering Issues:");
    console.log("   1. Check auction status (must be 'OPEN')");
    console.log("   2. Check if auction has expired");
    console.log("   3. Verify category filtering settings");
    console.log("   4. Check browser console for JavaScript errors");
  } else {
    console.log("✅ Auction should be visible in market view!");
    console.log("🔍 Check for JavaScript errors in browser console");
    console.log("🔍 Verify WebSocket/polling is updating the UI correctly");
  }
  
  console.log("\n🎉 Debug Analysis Complete!");
  console.log("\n💡 Next Steps:");
  console.log("   1. Run this debug script in browser console");
  console.log("   2. Check Network tab for API request/response details");
  console.log("   3. Check browser console for any JavaScript errors");
  console.log("   4. Verify user authentication status");
  console.log("   5. Test with different auction parameters");
}

// Make function available globally
window.runComprehensiveDebug = runComprehensiveDebug;

console.log("✅ Comprehensive debug script loaded!");
console.log("💡 Run: window.runComprehensiveDebug() to start debugging");