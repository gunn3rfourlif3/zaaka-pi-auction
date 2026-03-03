/**
 * 🎯 SAFER ENHANCED BID UPDATE HANDLER - Fixes DOM manipulation errors
 * This script provides robust bid update handling with comprehensive error handling
 * Run this in browser console (F12) when auction items are loaded
 */

console.clear();
console.log("🎯 SAFER ENHANCED BID UPDATE HANDLER - LOADING");
console.log("=".repeat(60));

// Safe DOM manipulation utilities
const safeDOM = {
    querySelector: (selector, parent = document) => {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`⚠️ Error querying selector "${selector}":`, error);
            return null;
        }
    },
    
    querySelectorAll: (selector, parent = document) => {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.warn(`⚠️ Error querying all selectors "${selector}":`, error);
            return [];
        }
    },
    
    setTextContent: (element, text) => {
        try {
            if (element && element.textContent !== undefined) {
                element.textContent = text;
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`⚠️ Error setting text content:`, error);
            return false;
        }
    },
    
    addClass: (element, className) => {
        try {
            if (element && element.classList) {
                element.classList.add(className);
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`⚠️ Error adding class "${className}":`, error);
            return false;
        }
    },
    
    removeClass: (element, className) => {
        try {
            if (element && element.classList) {
                element.classList.remove(className);
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`⚠️ Error removing class "${className}":`, error);
            return false;
        }
    },
    
    isValidElement: (element) => {
        return element && element.nodeType === 1 && element.parentNode;
    }
};

// Enhanced bid update handler with comprehensive error handling
window.handleBidUpdateSafe = function(data) {
    console.log("🎯 SAFER ENHANCED BID UPDATE RECEIVED:", data);
    
    if (!data || !data.auctionId || !data.newBid) {
        console.error("❌ Invalid bid update data:", data);
        return false;
    }
    
    const { auctionId, newBid, bidder } = data;
    
    // Update all visible bid displays for this auction
    let updatedCount = 0;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Method 1: Find by auction ID in data attributes (most reliable)
    try {
        const auctionElements = safeDOM.querySelectorAll(`[data-auction-id="${auctionId}"]`);
        auctionElements.forEach(el => {
            const bidDisplay = safeDOM.querySelector('.bid-amount, [class*="bid"], [class*="current"]', el);
            if (bidDisplay && safeDOM.isValidElement(bidDisplay)) {
                const success = safeDOM.setTextContent(bidDisplay, `${Number(newBid).toFixed(2)} π`);
                if (success) {
                    updatedCount++;
                    console.log(`✅ Updated bid display in data-auction-id element #${auctionId}`);
                }
            }
        });
    } catch (error) {
        console.warn(`⚠️ Error in Method 1 (data attributes):`, error);
    }
    
    // Method 2: Find by text content containing auction ID (fallback)
    try {
        const allElements = safeDOM.querySelectorAll('*');
        allElements.forEach(el => {
            if (!safeDOM.isValidElement(el)) return;
            
            const text = el.textContent || '';
            
            // Look for auction ID in text
            if (text.includes(`Asset #${auctionId}`) || text.includes(`#${auctionId}`)) {
                // Find the bid amount element within this container
                const bidElements = safeDOM.querySelectorAll('*', el);
                bidElements.forEach(bidEl => {
                    if (!safeDOM.isValidElement(bidEl)) return;
                    
                    const bidText = bidEl.textContent || '';
                    const bidMatch = bidText.match(/(\d+\.\d{2})\s*π/);
                    
                    if (bidMatch) {
                        // Update this bid amount
                        const newText = bidText.replace(bidMatch[0], `${Number(newBid).toFixed(2)} π`);
                        const success = safeDOM.setTextContent(bidEl, newText);
                        if (success) {
                            updatedCount++;
                            console.log(`✅ Updated bid display in text-matched element #${auctionId}: ${bidMatch[1]} → ${newBid}`);
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.warn(`⚠️ Error in Method 2 (text content):`, error);
    }
    
    // Method 3: Direct DOM manipulation for specific patterns (comprehensive)
    try {
        const allElements = safeDOM.querySelectorAll('*');
        allElements.forEach(el => {
            if (!safeDOM.isValidElement(el)) return;
            
            const text = el.textContent || '';
            
            // Look for bid amounts with π symbol
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            
            if (bidMatch) {
                const currentBid = parseFloat(bidMatch[1]);
                
                // Check if this element is related to our auction by proximity to auction ID
                const parent = el.parentElement;
                const grandparent = parent?.parentElement;
                const parentText = parent?.textContent || '';
                const grandparentText = grandparent?.textContent || '';
                
                if (parentText.includes(`Asset #${auctionId}`) || 
                    parentText.includes(`#${auctionId}`) || 
                    grandparentText.includes(`Asset #${auctionId}`) || 
                    grandparentText.includes(`#${auctionId}`)) {
                    
                    // Update the bid amount
                    const newText = text.replace(bidMatch[0], `${Number(newBid).toFixed(2)} π`);
                    const success = safeDOM.setTextContent(el, newText);
                    if (success) {
                        updatedCount++;
                        console.log(`✅ Updated bid display in proximity-matched element #${auctionId}: ${currentBid} → ${newBid}`);
                    }
                }
            }
        });
    } catch (error) {
        console.warn(`⚠️ Error in Method 3 (proximity matching):`, error);
    }
    
    // Method 4: Update React state if available (for better integration)
    try {
        if (window.updateAuctionItem && typeof window.updateAuctionItem === 'function') {
            window.updateAuctionItem(auctionId, newBid, bidder);
            updatedCount++;
            console.log(`✅ Updated via React state function`);
        }
    } catch (error) {
        console.warn(`⚠️ Error in Method 4 (React state):`, error);
    }
    
    // Method 5: Update auction detail page if available
    try {
        if (window.handleAuctionDetailBidUpdate && typeof window.handleAuctionDetailBidUpdate === 'function') {
            const detailUpdated = window.handleAuctionDetailBidUpdate(data);
            if (detailUpdated) {
                updatedCount++;
                console.log(`✅ Updated via auction detail page handler`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ Error in Method 5 (auction detail):`, error);
    }
    
    // Method 6: Update bid count in auction detail page
    try {
        const bidCountElements = safeDOM.querySelectorAll('.bid-count[data-auction-id="' + auctionId + '"]');
        bidCountElements.forEach(el => {
            if (!safeDOM.isValidElement(el)) return;
            
            const currentText = el.textContent || '';
            const countMatch = currentText.match(/(\d+)/);
            if (countMatch) {
                const currentCount = parseInt(countMatch[1]);
                const newCount = currentCount + 1;
                const newText = currentText.replace(countMatch[0], newCount.toString());
                const success = safeDOM.setTextContent(el, newText);
                if (success) {
                    updatedCount++;
                    console.log(`✅ Updated bid count: ${currentCount} → ${newCount}`);
                }
            }
        });
    } catch (error) {
        console.warn(`⚠️ Error in Method 6 (bid count):`, error);
    }
    
    // Add visual feedback with comprehensive error handling
    if (updatedCount > 0) {
        console.log(`🎉 Successfully updated ${updatedCount} bid display(s) for auction #${auctionId}`);
        
        // Add animation class to updated elements with safety checks
        try {
            const updatedElements = safeDOM.querySelectorAll(`[data-auction-id="${auctionId}"]`);
            updatedElements.forEach(el => {
                if (safeDOM.isValidElement(el)) {
                    safeDOM.addClass(el, 'bid-updated');
                    // Use setTimeout with safety check
                    setTimeout(() => {
                        try {
                            safeDOM.removeClass(el, 'bid-updated');
                        } catch (timeoutError) {
                            console.warn(`⚠️ Error removing animation class:`, timeoutError);
                        }
                    }, 1000);
                }
            });
        } catch (animationError) {
            console.warn(`⚠️ Error adding animation classes:`, animationError);
        }
        
        return true;
    } else {
        console.warn(`⚠️ No bid displays found for auction #${auctionId}`);
        
        // Retry mechanism for intermittent failures with safety checks
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retrying bid update (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(() => {
                try {
                    return window.handleBidUpdateSafe(data);
                } catch (retryError) {
                    console.error(`❌ Retry attempt ${retryCount} failed:`, retryError);
                    return false;
                }
            }, 500 * retryCount);
        }
        
        return false;
    }
};

// Enhanced auction item finder with error handling
window.findAllAuctionItemsSafe = function() {
    console.log("\n🔍 SAFER ENHANCED AUCTION ITEM FINDER");
    console.log("=".repeat(40));
    
    const items = [];
    
    try {
        // Method 1: Look for elements with auction IDs
        const allElements = safeDOM.querySelectorAll('*');
        allElements.forEach((el, index) => {
            if (!safeDOM.isValidElement(el)) return;
            
            const text = el.textContent || '';
            
            // Look for Asset # patterns
            const assetMatch = text.match(/Asset #(\d+)/);
            if (assetMatch) {
                const auctionId = parseInt(assetMatch[1]);
                
                // Look for bid amount in same element or nearby
                const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
                const currentBid = bidMatch ? parseFloat(bidMatch[1]) : null;
                
                items.push({
                    auctionId: auctionId,
                    currentBid: currentBid,
                    element: el,
                    text: text.trim().substring(0, 100), // First 100 chars
                    method: 'asset_pattern'
                });
            }
        });
        
        // Method 2: Look for bid amounts and try to find associated auction IDs
        allElements.forEach((el, index) => {
            if (!safeDOM.isValidElement(el)) return;
            
            const text = el.textContent || '';
            const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
            
            if (bidMatch && !items.some(item => item.element === el)) {
                const currentBid = parseFloat(bidMatch[1]);
                
                // Look for auction ID in parent elements
                let parent = el.parentElement;
                let auctionId = null;
                let foundMethod = 'bid_amount';
                
                while (parent && !auctionId) {
                    if (!safeDOM.isValidElement(parent)) break;
                    
                    const parentText = parent.textContent || '';
                    const idMatch = parentText.match(/Asset #(\d+)/) || parentText.match(/#(\d+)/);
                    
                    if (idMatch) {
                        auctionId = parseInt(idMatch[1]);
                        foundMethod = 'parent_search';
                        break;
                    }
                    
                    // Check for data attributes
                    const dataAuctionId = parent.getAttribute('data-auction-id');
                    if (dataAuctionId) {
                        auctionId = parseInt(dataAuctionId);
                        foundMethod = 'data_attribute';
                        break;
                    }
                    
                    parent = parent.parentElement;
                }
                
                if (auctionId) {
                    items.push({
                        auctionId: auctionId,
                        currentBid: currentBid,
                        element: el,
                        text: text.trim().substring(0, 100),
                        method: foundMethod
                    });
                }
            }
        });
        
        // Method 3: Look for data-auction-id attributes
        const dataElements = safeDOM.querySelectorAll('[data-auction-id]');
        dataElements.forEach(el => {
            if (!safeDOM.isValidElement(el)) return;
            
            const auctionId = parseInt(el.getAttribute('data-auction-id') || '0');
            if (auctionId > 0 && !items.some(item => item.auctionId === auctionId)) {
                const text = el.textContent || '';
                const bidMatch = text.match(/(\d+\.\d{2})\s*π/);
                const currentBid = bidMatch ? parseFloat(bidMatch[1]) : null;
                
                items.push({
                    auctionId: auctionId,
                    currentBid: currentBid,
                    element: el,
                    text: text.trim().substring(0, 100),
                    method: 'data_attribute'
                });
            }
        });
    } catch (error) {
        console.error(`❌ Error finding auction items:`, error);
    }
    
    // Remove duplicates and sort by auction ID
    const uniqueItems = items.filter((item, index, self) => 
        index === self.findIndex(t => t.auctionId === item.auctionId)
    ).sort((a, b) => a.auctionId - b.auctionId);
    
    console.log(`🔍 Found ${uniqueItems.length} unique auction items:`);
    uniqueItems.forEach(item => {
        console.log(`   Auction #${item.auctionId}: ${item.currentBid ? item.currentBid.toFixed(2) + ' π' : 'No bid found'} (${item.method})`);
    });
    
    return uniqueItems;
};

// Test function with enhanced reliability and error handling
window.testBidUpdatesSafe = function() {
    console.log("\n🧪 SAFER ENHANCED BID UPDATE TEST");
    console.log("=".repeat(50));
    
    try {
        // Find auction items first
        const items = window.findAllAuctionItemsSafe();
        
        if (items.length === 0) {
            console.log("❌ No auction items found. Make sure you're on Market or My Bids view.");
            return false;
        }
        
        // Test first item
        const firstItem = items[0];
        const testData = {
            auctionId: firstItem.auctionId,
            newBid: firstItem.currentBid ? firstItem.currentBid + 5.00 : 99.99,
            bidder: "safe_test_bidder"
        };
        
        console.log(`\n🎯 Testing auction #${firstItem.auctionId}:`);
        console.log(`Current bid: ${firstItem.currentBid ? firstItem.currentBid.toFixed(2) : 'N/A'} π`);
        console.log(`New bid: ${testData.newBid.toFixed(2)} π`);
        
        // Use safer handler
        const result = window.handleBidUpdateSafe(testData);
        console.log(`✅ Safer bid update test: ${result ? 'PASSED' : 'FAILED'}`);
        
        return result;
    } catch (error) {
        console.error(`❌ Error during safe bid update test:`, error);
        return false;
    }
};

// Connection monitoring with error handling
window.monitorBidConnectionSafe = function() {
    console.log("📊 Starting safe bid connection monitoring...");
    
    let lastUpdateTime = Date.now();
    let updateCount = 0;
    let connectionStatus = 'unknown';
    
    // Monitor bid updates with safety checks
    const originalHandler = window.handleBidUpdate;
    if (originalHandler) {
        window.handleBidUpdate = function(data) {
            try {
                lastUpdateTime = Date.now();
                updateCount++;
                console.log(`📡 Bid update #${updateCount} received at ${new Date().toLocaleTimeString()}`);
                return originalHandler(data);
            } catch (error) {
                console.error(`❌ Error in bid update handler:`, error);
                return false;
            }
        };
    }
    
    // Monitor connection status with safety checks
    const intervalId = setInterval(() => {
        try {
            const timeSinceLastUpdate = Date.now() - lastUpdateTime;
            const status = timeSinceLastUpdate < 60000 ? 'connected' : 'disconnected';
            
            if (status !== connectionStatus) {
                connectionStatus = status;
                console.log(`🔔 Connection status changed: ${status}`);
                
                if (status === 'disconnected') {
                    console.log(`⚠️ No bid updates for ${Math.floor(timeSinceLastUpdate / 1000)} seconds`);
                }
            }
        } catch (error) {
            console.error(`❌ Error in connection monitoring:`, error);
        }
    }, 10000); // Check every 10 seconds
    
    // Store interval ID for cleanup
    window.bidConnectionMonitorInterval = intervalId;
    
    console.log("✅ Safe connection monitoring started");
    
    // Return cleanup function
    return () => {
        try {
            if (window.bidConnectionMonitorInterval) {
                clearInterval(window.bidConnectionMonitorInterval);
                delete window.bidConnectionMonitorInterval;
                console.log("✅ Connection monitoring stopped");
            }
        } catch (error) {
            console.error(`❌ Error stopping connection monitoring:`, error);
        }
    };
};

// Make functions available globally with safety checks
window.handleBidUpdateSafe = window.handleBidUpdateSafe;
window.findAllAuctionItemsSafe = window.findAllAuctionItemsSafe;
window.testBidUpdatesSafe = window.testBidUpdatesSafe;
window.monitorBidConnectionSafe = window.monitorBidConnectionSafe;

// Auto-run safer test after page loads with comprehensive error handling
setTimeout(() => {
    try {
        console.log("\n" + "=".repeat(60));
        console.log("🧪 SAFER ENHANCED REAL-TIME BID TEST - READY");
        console.log("=".repeat(60));
        console.log("💡 Run: window.testBidUpdatesSafe()");
        console.log("💡 Run: window.monitorBidConnectionSafe()");
        console.log("💡 Run: window.findAllAuctionItemsSafe()");
        console.log("💡 Or wait 5 seconds for auto-test...");
        
        setTimeout(() => {
            try {
                window.testBidUpdatesSafe();
                window.monitorBidConnectionSafe();
            } catch (autoTestError) {
                console.error(`❌ Error during auto-test:`, autoTestError);
            }
        }, 5000);
    } catch (setupError) {
        console.error(`❌ Error during setup:`, setupError);
    }
}, 2000);