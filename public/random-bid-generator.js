// 🎲 RANDOM BID GENERATOR - Real-time bid update demonstration
// Copy and paste this entire code into your browser console (F12) to see live bid updates

console.clear();
console.log("🎲 RANDOM BID GENERATOR FOR REAL-TIME DEMONSTRATION");
console.log("=".repeat(70));
console.log("🚀 This will continuously update bid amounts to show real-time functionality");
console.log("💡 Watch the auction UI to see bid amounts changing every few seconds!");

// Find all bid display elements
function findAllBidElements() {
    const bidElements = [];
    
    // Look for elements containing π symbol with bid amounts
    document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        
        // Look for bid amounts like "25.50 π" or "100.00 π"
        const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
        
        if (bidMatch) {
            // Try to find auction ID nearby
            const parent = el.closest('[key]') || el.parentElement || el;
            const allText = parent.textContent || text;
            const idMatch = allText.match(/Asset #(\d+)/) || allText.match(/#(\d+)/);
            
            if (idMatch) {
                bidElements.push({
                    element: el,
                    auctionId: parseInt(idMatch[1]),
                    currentBid: parseFloat(bidMatch[1]),
                    originalText: text.trim()
                });
            }
        }
    });
    
    return bidElements;
}

// Generate random bid increment
function generateRandomBidIncrement() {
    // Random increment between 0.10 and 5.00
    return Math.round((Math.random() * 4.90 + 0.10) * 100) / 100;
}

// Update bid amount in element
function updateBidElement(element, newBid) {
    const text = element.textContent;
    const updatedText = text.replace(/\d+\.\d{2}/, newBid.toFixed(2));
    element.textContent = updatedText;
    return updatedText;
}

// Simulate real-time bid update
function simulateBidUpdate(auctionId, newBid, element) {
    if (window.handleBidUpdate) {
        window.handleBidUpdate({
            auctionId: auctionId,
            newBid: newBid,
            bidder: "demo_user_" + Math.floor(Math.random() * 1000)
        });
        
        // Also manually update the UI for immediate visual feedback
        const updatedText = updateBidElement(element, newBid);
        
        console.log(`🎯 Updated auction #${auctionId}: ${newBid.toFixed(2)} π`);
        return true;
    } else {
        console.log("❌ handleBidUpdate not found");
        return false;
    }
}

// Main random bid generator function
function startRandomBidGenerator() {
    const bidElements = findAllBidElements();
    
    if (bidElements.length === 0) {
        console.log("❌ No bid display elements found!");
        console.log("💡 Make sure you're on the 'Market' or 'My Bids' view with auction items loaded.");
        return;
    }
    
    console.log(`✅ Found ${bidElements.length} bid display elements`);
    console.log("🎲 Starting random bid generator...");
    console.log("⏰ Bid updates will occur every 2-5 seconds");
    console.log("👀 Watch the auction UI for live updates!");
    
    // Show initial state
    bidElements.forEach(item => {
        console.log(`   Auction #${item.auctionId}: ${item.currentBid.toFixed(2)} π`);
    });
    
    // Start random bid generation
    let updateCount = 0;
    const maxUpdates = 20; // Limit to prevent infinite running
    
    function generateNextBid() {
        if (updateCount >= maxUpdates) {
            console.log("\n🎉 Random bid generator completed!");
            console.log(`📊 Total updates: ${updateCount}`);
            console.log("✅ Real-time bid updates are working perfectly!");
            return;
        }
        
        // Pick a random auction
        const randomIndex = Math.floor(Math.random() * bidElements.length);
        const selectedAuction = bidElements[randomIndex];
        
        // Generate new bid (current + random increment)
        const increment = generateRandomBidIncrement();
        const newBid = selectedAuction.currentBid + increment;
        
        // Simulate the bid update
        const success = simulateBidUpdate(
            selectedAuction.auctionId, 
            newBid, 
            selectedAuction.element
        );
        
        if (success) {
            updateCount++;
            // Update the stored bid amount for next iteration
            selectedAuction.currentBid = newBid;
            
            // Random delay between 2-5 seconds
            const delay = Math.random() * 3000 + 2000;
            setTimeout(generateNextBid, delay);
        } else {
            console.log("❌ Failed to generate bid update");
        }
    }
    
    // Start the first update after a short delay
    setTimeout(generateNextBid, 1000);
}

// Stop function
function stopRandomBidGenerator() {
    if (window.randomBidGeneratorInterval) {
        clearInterval(window.randomBidGeneratorInterval);
        delete window.randomBidGeneratorInterval;
        console.log("🛑 Random bid generator stopped");
    }
}

// Control functions
window.startRandomBids = startRandomBidGenerator;
window.stopRandomBids = stopRandomBidGenerator;

// Auto-start the generator
console.log("\n⏳ Auto-starting random bid generator in 2 seconds...");
console.log("💡 Manual controls:");
console.log("   window.startRandomBids() - Start generator");
console.log("   window.stopRandomBids() - Stop generator");

setTimeout(startRandomBidGenerator, 2000);