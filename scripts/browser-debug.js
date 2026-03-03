// LIVE BROWSER DEBUG - CHECK REAL-TIME UPDATES
console.log("🎯 LIVE BROWSER DEBUG - CHECKING REAL-TIME UPDATES");
console.log("=".repeat(70));
console.log("This will help us see what's happening in the actual browser");
console.log("=".repeat(70));

// Override the console.log to capture all logs
const originalLog = console.log;
const capturedLogs = [];
console.log = function(...args) {
    capturedLogs.push(args.join(' '));
    originalLog.apply(console, args);
};

// Check if we're in ngrok environment
const isNgrok = window.location.hostname.includes('ngrok');
console.log(`🌐 Environment: ${isNgrok ? 'NGROK' : 'LOCALHOST'}`);
console.log(`📍 Current URL: ${window.location.href}`);

// Monitor the WebSocket connection hook
let connectionCheckInterval;
let updateCount = 0;

function checkConnectionStatus() {
    // Look for connection status in the DOM
    const statusElements = document.querySelectorAll('[data-connection-status]');
    const transportElements = document.querySelectorAll('[data-transport]');
    
    if (statusElements.length > 0) {
        console.log(`📡 Connection Status Elements Found: ${statusElements.length}`);
        statusElements.forEach((el, i) => {
            console.log(`  Status ${i}: ${el.textContent || el.getAttribute('data-connection-status')}`);
        });
    }
    
    if (transportElements.length > 0) {
        console.log(`🚗 Transport Elements Found: ${transportElements.length}`);
        transportElements.forEach((el, i) => {
            console.log(`  Transport ${i}: ${el.textContent || el.getAttribute('data-transport')}`);
        });
    }
}

// Monitor bid updates
function monitorBidUpdates() {
    console.log("🔍 Monitoring for bid updates...");
    
    // Create a mock bid update to test the system
    setTimeout(() => {
        console.log("🧪 Sending test bid update...");
        
        // Simulate a bid update event
        const testBidData = {
            auctionId: 3330,
            newBid: 999.99,
            bidder: "test_user_debug",
            type: "bid_update"
        };
        
        // Try to trigger the bid update handler directly
        if (window.handleBidUpdate) {
            console.log("✅ Found handleBidUpdate function, calling it...");
            window.handleBidUpdate(testBidData);
        } else {
            console.log("❌ handleBidUpdate function not found on window");
        }
        
        // Try to find React components that might handle updates
        const reactRoots = document.querySelectorAll('[data-reactroot], #__next');
        console.log(`📊 Found ${reactRoots.length} React root elements`);
        
        // Look for auction-related elements
        const auctionElements = document.querySelectorAll('[data-auction-id], .auction-item, .bid-amount');
        console.log(`🏷️  Found ${auctionElements.length} auction-related elements`);
        
        auctionElements.forEach((el, i) => {
            const auctionId = el.getAttribute('data-auction-id');
            const currentBid = el.textContent || el.getAttribute('data-current-bid');
            console.log(`  Auction Element ${i}: ID=${auctionId}, Current=${currentBid}`);
        });
        
    }, 3000);
}

// Monitor HTTP polling if available
function checkHttpPolling() {
    if (window.httpPollingClient) {
        console.log("✅ HTTP Polling Client found on window");
        console.log("📡 HTTP Polling Status:", window.httpPollingClient.getStatus ? window.httpPollingClient.getStatus() : 'unknown');
    } else {
        console.log("❌ HTTP Polling Client not found on window");
    }
}

// Monitor WebSocket if available
function checkWebSocket() {
    if (window.socket) {
        console.log("✅ Socket.IO found on window");
        console.log("📡 Socket Status:", window.socket.connected ? 'connected' : 'disconnected');
        console.log("🚗 Socket Transport:", window.socket.io?.engine?.transport?.name || 'unknown');
    } else {
        console.log("❌ Socket.IO not found on window");
    }
}

// Monitor all network requests
function monitorNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        console.log(`🌐 Fetch Request: ${url}`);
        console.log(`   Method: ${options?.method || 'GET'}`);
        
        return originalFetch.apply(this, args).then(response => {
            console.log(`   Response Status: ${response.status}`);
            
            // Check if this is a polling request
            if (url.includes('http-poll')) {
                console.log(`📡 HTTP Polling Request Detected!`);
                response.clone().json().then(data => {
                    console.log(`   Polling Response Data:`, data);
                }).catch(err => {
                    console.log(`   Could not parse polling response:`, err);
                });
            }
            
            return response;
        });
    };
}

// Main debug function
function runBrowserDebug() {
    console.log("🚀 Starting browser debug...");
    
    // Initial checks
    checkConnectionStatus();
    checkHttpPolling();
    checkWebSocket();
    monitorNetworkRequests();
    
    // Start monitoring
    connectionCheckInterval = setInterval(() => {
        checkConnectionStatus();
    }, 5000);
    
    // Monitor for updates
    monitorBidUpdates();
    
    // Show all captured logs after 10 seconds
    setTimeout(() => {
        console.log("\n" + "=".repeat(70));
        console.log("📋 CAPTURED LOGS SUMMARY");
        console.log("=".repeat(70));
        
        const relevantLogs = capturedLogs.filter(log => 
            log.includes('bid') || 
            log.includes('update') || 
            log.includes('auction') || 
            log.includes('polling') || 
            log.includes('socket') ||
            log.includes('connection')
        );
        
        if (relevantLogs.length > 0) {
            relevantLogs.forEach(log => console.log(log));
        } else {
            console.log("No relevant bid/update logs captured");
        }
        
        console.log("\n🎯 DEBUG COMPLETE - Check if bid updates are appearing in the UI!");
        console.log("💡 If you see bid updates in the logs but not in the UI, the issue is in the React component update logic.");
        
        // Restore original console.log
        console.log = originalLog;
        
        // Clear interval
        clearInterval(connectionCheckInterval);
        
    }, 10000);
}

// Export functions to window for manual testing
window.runBrowserDebug = runBrowserDebug;
window.debugBidUpdate = function(auctionId, newBid, bidder) {
    const testData = { auctionId, newBid, bidder, type: "bid_update" };
    console.log("🧪 Manual bid update test:", testData);
    
    if (window.handleBidUpdate) {
        window.handleBidUpdate(testData);
        console.log("✅ Called handleBidUpdate");
    } else {
        console.log("❌ handleBidUpdate not found");
    }
};

// Auto-start the debug
console.log("🎯 Browser Debug Script Loaded!");
console.log("💡 Run window.runBrowserDebug() to start debugging");
console.log("💡 Run window.debugBidUpdate(3330, 500, 'test_user') to test bid updates");

// Start automatically after 2 seconds
setTimeout(runBrowserDebug, 2000);