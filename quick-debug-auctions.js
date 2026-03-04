// 🚀 QUICK AUCTION DEBUG TEST
// Run this to quickly identify why auctions aren't showing in market

console.log("🔍 QUICK AUCTION MARKET DEBUG");
console.log("=============================");

// Immediate checks
console.log("\n📋 Current Environment:");
console.log(`   User Agent: ${navigator.userAgent}`);
console.log(`   Current Time: ${new Date().toLocaleString()}`);
console.log(`   View: ${window.currentView || 'unknown'}`);

// Check if user is logged in
const checkUserAuth = () => {
  // Look for user data in localStorage or window
  const userData = window.user || localStorage.getItem('user');
  console.log("\n👤 User Authentication:");
  console.log(`   User Data: ${userData ? 'Found' : 'Not Found'}`);
  if (userData) {
    console.log(`   User Info: ${JSON.stringify(userData, null, 2)}`);
  }
  return userData;
};

// Test API connectivity
const testAPIs = async () => {
  console.log("\n🌐 Testing API Connectivity:");
  
  const endpoints = [
    '/api/auctions/live',
    '/api/auctions/create',
    '/api/seller/items'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (endpoint === '/api/auctions/live' && response.ok) {
        const data = await response.json();
        console.log(`   📊 Live Auctions Count: ${data.length}`);
        
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   📝 Sample Auction: "${sample.title}" (ID: ${sample.id})`);
          console.log(`      Status: ${sample.status} | Expires: ${new Date(sample.expires_at).toLocaleString()}`);
          
          // Check for common issues
          const now = Date.now();
          const expiresAt = new Date(sample.expires_at).getTime();
          const isExpired = expiresAt <= now;
          
          if (isExpired) {
            console.log(`      ⚠️  EXPIRED! (expired ${Math.round((now - expiresAt) / 1000)} seconds ago)`);
          }
          if (sample.status !== 'OPEN') {
            console.log(`      ⚠️  Status is "${sample.status}" (should be "OPEN")`);
          }
        }
      }
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Error - ${error.message}`);
    }
  }
};

// Check for JavaScript errors
const checkJSErrors = () => {
  console.log("\n⚠️  Checking for JavaScript Errors:");
  
  // Override console.error to capture recent errors
  const originalError = console.error;
  const recentErrors = [];
  
  console.error = function(...args) {
    recentErrors.push({
      timestamp: new Date().toISOString(),
      message: args.join(' ')
    });
    originalError.apply(console, args);
  };
  
  // Check for common issues
  setTimeout(() => {
    if (recentErrors.length > 0) {
      console.log(`   Found ${recentErrors.length} recent errors:`);
      recentErrors.slice(-3).forEach(error => {
        console.log(`   - ${error.message}`);
      });
    } else {
      console.log("   No recent JavaScript errors detected");
    }
    
    // Restore original console.error
    console.error = originalError;
  }, 1000);
};

// Quick auction creation test
const quickCreateTest = async () => {
  console.log("\n🧪 Quick Auction Creation Test:");
  
  const testData = {
    title: "Quick Debug Test Auction",
    description: "Testing market visibility",
    price: "1.5",
    category: "General",
    sellerId: "debug_user",
    imageUrls: ["https://via.placeholder.com/300x200?text=Test"],
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
  
  try {
    console.log("   Creating test auction...");
    const response = await fetch('/api/auctions/create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`   Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Created! ID: ${result.id}`);
      console.log(`   Status: ${result.status} | Expires: ${new Date(result.expires_at).toLocaleString()}`);
      return result;
    } else {
      const error = await response.json();
      console.log(`   ❌ Failed: ${error.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
};

// Run all tests
const runQuickDebug = async () => {
  console.log("🚀 Starting Quick Debug Tests...\n");
  
  checkUserAuth();
  await testAPIs();
  checkJSErrors();
  
  const createdAuction = await quickCreateTest();
  
  if (createdAuction) {
    console.log("\n🔍 Checking if auction appears in market...");
    
    // Wait a moment then check live auctions
    setTimeout(async () => {
      try {
        const response = await fetch('/api/auctions/live', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const auctions = await response.json();
        
        const found = auctions.find(a => a.id === createdAuction.id);
        if (found) {
          console.log("✅ Test auction found in live auctions!");
        } else {
          console.log("❌ Test auction NOT found in live auctions!");
          console.log("🔍 Issue is likely in API/database layer");
        }
      } catch (error) {
        console.log(`❌ Error checking live auctions: ${error.message}`);
      }
    }, 2000);
  }
  
  console.log("\n🎉 Quick Debug Complete!");
  console.log("\n💡 Check Network tab for detailed API calls");
  console.log("💡 Check Console for any JavaScript errors");
  console.log("💡 Verify user authentication status");
};

// Make available globally
window.runQuickDebug = runQuickDebug;

console.log("✅ Quick debug script loaded!");
console.log("💡 Run: window.runQuickDebug() to start debugging");