// Simple test to verify real-time bid updates work
console.log("🧪 TESTING REAL-TIME BID UPDATES");

// Test configuration
const testAuctionId = 2931; // Use the auction ID from the logs
const testBidAmount = 25.5;
const testBidder = "test_user";

async function testBidUpdate() {
    try {
        console.log("📡 Sending test bid update...");
        
        const response = await fetch('http://localhost:5500/api/http-poll?action=update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                auctionId: testAuctionId,
                newBid: testBidAmount,
                bidder: testBidder,
                type: 'bid_update'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Bid update sent successfully:", data);
            return true;
        } else {
            console.error("❌ Bid update failed:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Bid update test error:", error);
        return false;
    }
}

async function testConnection() {
    console.log("🔌 Testing HTTP polling connection...");
    
    try {
        const response = await fetch('http://localhost:5500/api/http-poll?action=poll&auctionId=2931&clientId=test_client', {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ HTTP polling connection successful:", data);
            return true;
        } else {
            console.error("❌ HTTP polling connection failed:", response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ HTTP polling connection test error:", error);
        return false;
    }
}

// Run tests
async function runTests() {
    console.log("🚀 Starting real-time functionality tests...");
    
    const connectionTest = await testConnection();
    const bidUpdateTest = await testBidUpdate();
    
    console.log("\n📊 Test Results:");
    console.log("   Connection Test:", connectionTest ? "✅ PASSED" : "❌ FAILED");
    console.log("   Bid Update Test:", bidUpdateTest ? "✅ PASSED" : "❌ FAILED");
    
    if (connectionTest && bidUpdateTest) {
        console.log("\n🎉 All tests passed! Real-time functionality is working.");
    } else {
        console.log("\n⚠️  Some tests failed. Check server logs for details.");
    }
}

runTests();