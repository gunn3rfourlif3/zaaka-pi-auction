// 🎲 ENHANCED RANDOM BID GENERATOR - Live real-time demonstration
// Copy and paste this entire code into your browser console (F12)

console.clear();
console.log("🎲 ENHANCED RANDOM BID GENERATOR - LIVE DEMONSTRATION");
console.log("=".repeat(70));
console.log("🚀 This will create realistic bid updates every 2-5 seconds");
console.log("💡 Watch auction bid amounts change in real-time!");

// Track all bid elements and their state
let bidTracker = {};
let updateInterval;

// Find all bid display elements with detailed tracking
function findAllBidElements() {
    const bidElements = [];
    
    console.log("🔍 Scanning for bid display elements...");
    
    // Look for elements containing π symbol with bid amounts
    document.querySelectorAll('*').forEach((el, index) => {
        const text = el.textContent || '';
        
        // Look for bid amounts like "25.50 π" or "100.00 π"
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            // Try to find auction ID nearby
            const parent = el.closest('[key]') || el.parentElement || el;
            const allText = parent.textContent || text;
            const idMatch = allText.match(/Asset #(\d+)/) || allText.match(/#(\d+)/);
            
            if (idMatch) {
                const auctionId = parseInt(idMatch[1]);
                const currentBid = parseFloat(bidMatch[1]);
                
                bidElements.push({
                    element: el,
                    auctionId: auctionId,
                    currentBid: currentBid,
                    originalText: text.trim(),
                    elementIndex: index
                });
                
                console.log(`✅ Found auction #${auctionId}: ${currentBid.toFixed(2)} π`);
            }
        }
    });
    
    return bidElements;
}

// Generate realistic bid increment (0.10 to 2.50)
function generateRealisticBidIncrement() {
    // Most bids are small increments
    const smallIncrement = Math.random() < 0.8;
    
    if (smallIncrement) {
        return Math.round((Math.random() * 0.40 + 0.10) * 100) / 100; // 0.10 - 0.50
    } else {
        return Math.round((Math.random() * 2.00 + 0.50) * 100) / 100; // 0.50 - 2.50
    }
}

// Generate realistic bidder name
function generateBidderName() {
    const prefixes = ['user', 'bidder', 'buyer', 'collector', 'trader'];
    const numbers = Math.floor(Math.random() * 9999) + 100;
    return prefixes[Math.floor(Math.random() * prefixes.length)] + '_' + numbers;
}

// Update bid with animation effect
function updateBidWithAnimation(element, newBid, bidder) {
    const originalText = element.textContent;
    
    // Create a brief highlight effect
    element.style.transition = 'all 0.3s ease';
    element.style.backgroundColor = '#fef3c7'; // Light yellow highlight
    element.style.transform = 'scale(1.05)';
    
    // Update the text
    const updatedText = originalText.replace(/\d+\.\d{2}/, newBid.toFixed(2));
    element.textContent = updatedText;
    
    // Reset styles after animation
    setTimeout(() => {
        element.style.backgroundColor = '';
        element.style.transform = '';
    }, 300);
    
    return updatedText;
}

// Simulate a realistic bid update
function simulateRealisticBid(auctionData) {
    const increment = generateRealisticBidIncrement();
    const newBid = auctionData.currentBid + increment;
    const bidder = generateBidderName();
    
    // Use the handleBidUpdate function for proper integration
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: auctionData.auctionId,
            newBid: newBid,
            bidder: bidder
        });
        
        // Also update the UI immediately for visual feedback
        updateBidWithAnimation(auctionData.element, newBid, bidder);
        
        console.log(`🎯 Auction #${auctionData.auctionId}: ${auctionData.currentBid.toFixed(2)} → ${newBid.toFixed(2)} π by @${bidder}`);
        
        // Update tracked data
        auctionData.currentBid = newBid;
        
        return true;
    } else {
        console.log("❌ handleBidUpdate not found");
        return false;
    }
}

// Create a realistic bidding scenario
function createRealisticBiddingScenario() {
    const bidElements = findAllBidElements();
    
    if (bidElements.length === 0) {
        console.log("❌ No bid display elements found!");
        console.log("💡 Make sure you're on the 'Market' or 'My Bids' view with auction items loaded.");
        return;
    }
    
    console.log(`🎬 Starting realistic bidding scenario with ${bidElements.length} auctions`);
    console.log("⏰ New bids will appear every 2-5 seconds");
    console.log("👀 Watch for bid amounts changing with realistic increments!");
    
    // Show initial state
    console.log("📊 Initial auction states:");
    bidElements.forEach(item => {
        console.log(`   Auction #${item.auctionId}: ${item.currentBid.toFixed(2)} π`);
    });
    
    // Track bid history
    let totalBids = 0;
    let bidHistory = [];
    
    function generateNextBid() {
        // Pick a random auction (some auctions get more bids than others)
        const weights = bidElements.map(() => Math.random() * 2 + 0.5); // Weighted random
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        let selectedIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedIndex = i;
                break;
            }
        }
        
        const selectedAuction = bidElements[selectedIndex];
        
        // Simulate bid with 90% success rate (some auctions don't get bids)
        if (Math.random() < 0.9) {
            const success = simulateRealisticBid(selectedAuction);
            
            if (success) {
                totalBids++;
                bidHistory.push({
                    auctionId: selectedAuction.auctionId,
                    bid: selectedAuction.currentBid,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        }
        
        // Continue with random delay
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        setTimeout(generateNextBid, delay);
    }
    
    // Start the bidding simulation
    setTimeout(generateNextBid, 1000);
    
    // Return control functions
    return {
        stop: function() {
            if (window.biddingSimulationInterval) {
                clearInterval(window.biddingSimulationInterval);
                console.log("\n🛑 Bidding simulation stopped");
                console.log(`📈 Total bids generated: ${totalBids}`);
                console.log(`📊 Bid history:`, bidHistory.slice(-5)); // Last 5 bids
            }
        },
        getStats: function() {
            return {
                totalBids: totalBids,
                activeAuctions: bidElements.length,
                bidHistory: bidHistory
            };
        }
    };
}

// Enhanced random bid generator with realistic patterns
function startEnhancedRandomBids() {
    console.log("\n🎲 Starting enhanced random bid generator...");
    
    const simulation = createRealisticBiddingScenario();
    
    // Make control functions available globally
    window.stopEnhancedBids = simulation.stop;
    window.getBidStats = simulation.getStats;
    
    console.log("\n💡 Control functions available:");
    console.log("   window.stopEnhancedBids() - Stop the simulation");
    console.log("   window.getBidStats() - Get bidding statistics");
}

// Auto-start the enhanced generator
console.log("\n⏳ Auto-starting enhanced random bid generator in 3 seconds...");
setTimeout(startEnhancedRandomBids, 3000);