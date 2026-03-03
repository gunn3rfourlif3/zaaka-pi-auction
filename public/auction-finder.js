// COMPREHENSIVE FRONTEND AUCTION FINDER
// This will find ALL auction-related elements on your page

console.log("🔍 COMPREHENSIVE AUCTION FINDER");
console.log("=".repeat(70));
console.log("Finding all auction-related elements on the page...");
console.log("=".repeat(70));

// Function to find auction items comprehensively
function findAllAuctionItems() {
    console.log("🔍 Searching for auction items...");
    
    // Method 1: Look for data-auction-id attributes
    const dataAuctionItems = document.querySelectorAll('[data-auction-id]');
    console.log(`📊 Found ${dataAuctionItems.length} items with data-auction-id`);
    
    // Method 2: Look for common auction-related class names
    const auctionClasses = [
        'auction-item', 'auction', 'bid-item', 'item-card', 'product-card',
        'auction-card', 'listing-item', 'market-item', 'auction-listing'
    ];
    
    const classAuctionItems = [];
    auctionClasses.forEach(className => {
        const items = document.querySelectorAll(`.${className}`);
        if (items.length > 0) {
            classAuctionItems.push(...items);
            console.log(`📋 Found ${items.length} items with class "${className}"`);
        }
    });
    
    // Method 3: Look for elements containing auction-related text
    const allElements = document.querySelectorAll('*');
    const textAuctionItems = [];
    const auctionKeywords = ['auction', 'bid', 'current bid', 'highest bid', 'π', 'pi'];
    
    allElements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        const hasAuctionKeyword = auctionKeywords.some(keyword => text.includes(keyword));
        
        if (hasAuctionKeyword && el.textContent.trim().length > 0 && el.textContent.trim().length < 200) {
            // Avoid duplicates and script/style tags
            if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && !textAuctionItems.includes(el)) {
                textAuctionItems.push(el);
            }
        }
    });
    
    console.log(`🔍 Found ${textAuctionItems.length} items with auction-related text`);
    
    // Method 4: Look for price/bid displays
    const priceSelectors = [
        '.price', '.current-bid', '.bid-amount', '.highest-bid', '.current-price',
        '[class*="price"]', '[class*="bid"]', '[class*="current"]'
    ];
    
    const priceElements = [];
    priceSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                priceElements.push(...elements);
                console.log(`💰 Found ${elements.length} elements with selector "${selector}"`);
            }
        } catch (e) {
            // Invalid selector, skip
        }
    });
    
    // Combine all findings
    const allAuctionItems = [
        ...dataAuctionItems,
        ...classAuctionItems,
        ...textAuctionItems,
        ...priceElements
    ];
    
    // Remove duplicates
    const uniqueItems = Array.from(new Set(allAuctionItems));
    
    console.log(`\n🎯 TOTAL UNIQUE AUCTION ITEMS FOUND: ${uniqueItems.length}`);
    
    // Analyze each item
    uniqueItems.forEach((item, index) => {
        console.log(`\n--- Auction Item ${index + 1} ---`);
        console.log(`Tag: ${item.tagName}`);
        console.log(`Classes: ${item.className || 'none'}`);
        console.log(`ID: ${item.id || 'none'}`);
        console.log(`Text: "${item.textContent.trim().substring(0, 100)}"`);
        
        // Look for price/bid amounts
        const text = item.textContent;
        const priceMatch = text.match(/[\d,]+\.?\d*/g);
        if (priceMatch) {
            console.log(`Prices found: ${priceMatch.join(', ')}`);
        }
        
        // Look for auction ID in attributes or text
        const auctionId = item.getAttribute('data-auction-id') || 
                         item.getAttribute('data-id') ||
                         text.match(/#?(\d+)/)?.[1];
        
        if (auctionId) {
            console.log(`Auction ID: ${auctionId}`);
        }
    });
    
    return uniqueItems;
}

// Function to find specific bid amounts
function findBidAmounts() {
    console.log("\n🔍 Searching for bid amount displays...");
    
    // Common patterns for bid amounts
    const bidPatterns = [
        /current bid:?\s*([\d,]+\.?\d*)/i,
        /highest bid:?\s*([\d,]+\.?\d*)/i,
        /bid:?\s*([\d,]+\.?\d*)/i,
        /price:?\s*([\d,]+\.?\d*)/i,
        /π\s*([\d,]+\.?\d*)/i,
        /([\d,]+\.?\d*)\s*π/i
    ];
    
    const allText = document.body.innerText;
    const foundBids = [];
    
    bidPatterns.forEach((pattern, index) => {
        const matches = allText.match(pattern);
        if (matches) {
            foundBids.push({
                pattern: index + 1,
                amount: matches[1],
                context: matches[0].substring(0, 50)
            });
        }
    });
    
    console.log(`\n💰 Found ${foundBids.length} bid amount patterns:`);
    foundBids.forEach(bid => {
        console.log(`  Pattern ${bid.pattern}: "${bid.context}" → ${bid.amount}`);
    });
    
    return foundBids;
}

// Function to test with found auction
function testWithFoundAuction(auctionItems) {
    if (auctionItems.length === 0) {
        console.log("\n❌ No auction items found to test with");
        return;
    }
    
    // Use the first auction item
    const testItem = auctionItems[0];
    console.log(`\n🧪 Testing with first auction item:`);
    console.log(`Element: <${testItem.tagName}>`);
    console.log(`Text: "${testItem.textContent.trim().substring(0, 100)}"`);
    
    // Find current bid amount
    const text = testItem.textContent;
    const currentBidMatch = text.match(/[\d,]+\.?\d*/);
    const currentBid = currentBidMatch ? parseFloat(currentBidMatch[0].replace(',', '')) : 100;
    const newBid = currentBid + 50;
    
    console.log(`Current bid: ${currentBid}`);
    console.log(`Test bid: ${newBid}`);
    
    // Try to find auction ID
    const auctionId = testItem.getAttribute('data-auction-id') || 
                     testItem.getAttribute('data-id') ||
                     text.match(/#?(\d+)/)?.[1] ||
                     '3330'; // fallback
    
    console.log(`Auction ID: ${auctionId}`);
    
    return {
        auctionId: parseInt(auctionId),
        currentBid: currentBid,
        newBid: newBid,
        element: testItem
    };
}

// Main execution
console.log("🚀 Starting comprehensive auction finder...");

const auctionItems = findAllAuctionItems();
const bidAmounts = findBidAmounts();
const testData = testWithFoundAuction(auctionItems);

console.log("\n" + "=".repeat(70));
console.log("📋 SUMMARY");
console.log("=".repeat(70));
console.log(`✅ Found ${auctionItems.length} potential auction items`);
console.log(`✅ Found ${bidAmounts.length} bid amount patterns`);

if (testData) {
    console.log(`✅ Ready to test with auction #${testData.auctionId}`);
    console.log(`✅ Current bid: ${testData.currentBid}, Test bid: ${testData.newBid}`);
    
    // Export test function
    window.testWithRealAuction = function() {
        console.log("🧪 Testing with real auction data...");
        
        if (window.handleBidUpdate) {
            window.handleBidUpdate({
                auctionId: testData.auctionId,
                newBid: testData.newBid,
                bidder: "finder_test_user"
            });
            console.log(`✅ Sent test bid: ${testData.newBid}π for auction #${testData.auctionId}`);
        } else {
            console.log("❌ handleBidUpdate function not found");
        }
    };
    
    console.log("\n💡 Run window.testWithRealAuction() to test bid updates");
}

console.log("\n🎯 AUCTION FINDER COMPLETE!");

// Auto-test after 2 seconds
setTimeout(() => {
    if (testData && window.handleBidUpdate) {
        console.log("🚀 Auto-testing with found auction...");
        window.testWithRealAuction();
    }
}, 2000);