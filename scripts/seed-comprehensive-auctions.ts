/**
 * 🎯 COMPREHENSIVE AUCTION SEEDING SCRIPT
 * Seeds 100 auctions with edge cases, multiple users, max bids, and sniping scenarios
 * All auctions under 5Pi with 1-hour duration
 * 
 * Run: ts-node scripts/seed-comprehensive-auctions.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();

// Categories for diverse auction types
const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Art', 'Jewelry', 
  'Collectibles', 'Automotive', 'Health & Beauty', 'Toys', 'Food & Beverages',
  'Music', 'Photography', 'Crafts', 'Vintage', 'Technology', 'Games', 'Travel', 'Other'
];

// Multiple test users with different behaviors
const TEST_USERS = [
  { id: 'test_user_1', username: 'auction_hunter', name: 'Auction Hunter' },
  { id: 'test_user_2', username: 'bid_master', name: 'Bid Master' },
  { id: 'test_user_3', username: 'snipe_king', name: 'Snipe King' },
  { id: 'test_user_4', username: 'max_bidder', name: 'Max Bidder' },
  { id: 'test_user_5', username: 'casual_buyer', name: 'Casual Buyer' },
  { id: 'test_user_6', username: 'power_seller', name: 'Power Seller' },
  { id: 'test_user_7', username: 'collector_pro', name: 'Collector Pro' },
  { id: 'test_user_8', username: 'deal_seeker', name: 'Deal Seeker' },
  { id: 'test_user_9', username: 'auction_pro', name: 'Auction Pro' },
  { id: 'test_user_10', username: 'bid_warrior', name: 'Bid Warrior' }
];

// Sample items for realistic auctions
const SAMPLE_ITEMS = [
  // Electronics (Under 5Pi)
  { title: 'Wireless Earbuds Pro', description: 'Premium wireless earbuds with noise cancellation', category: 'Electronics' },
  { title: 'Smartphone Case Bundle', description: '3-pack premium phone cases', category: 'Electronics' },
  { title: 'USB-C Cable Set', description: 'High-speed charging cables', category: 'Electronics' },
  { title: 'Bluetooth Speaker Mini', description: 'Portable wireless speaker', category: 'Electronics' },
  { title: 'Phone Stand Adjustable', description: 'Ergonomic phone holder', category: 'Electronics' },
  
  // Fashion (Under 5Pi)
  { title: 'Designer Sunglasses', description: 'UV protection fashion sunglasses', category: 'Fashion' },
  { title: 'Leather Wallet Premium', description: 'Genuine leather bifold wallet', category: 'Fashion' },
  { title: 'Watch Band Collection', description: '3 interchangeable watch bands', category: 'Fashion' },
  { title: 'Silk Scarf Luxury', description: 'Hand-printed silk scarf', category: 'Fashion' },
  { title: 'Cap Vintage Style', description: 'Retro-style baseball cap', category: 'Fashion' },
  
  // Home & Garden (Under 5Pi)
  { title: 'Plant Pot Set', description: 'Ceramic planters for indoor plants', category: 'Home & Garden' },
  { title: 'LED Strip Lights', description: 'Color-changing LED light strip', category: 'Home & Garden' },
  { title: 'Kitchen Gadget Bundle', description: 'Essential kitchen tools set', category: 'Home & Garden' },
  { title: 'Candle Collection', description: 'Scented candles gift set', category: 'Home & Garden' },
  { title: 'Picture Frame Set', description: 'Decorative photo frames', category: 'Home & Garden' },
  
  // Sports (Under 5Pi)
  { title: 'Yoga Mat Travel', description: 'Foldable yoga mat for travel', category: 'Sports' },
  { title: 'Water Bottle Insulated', description: 'Stainless steel water bottle', category: 'Sports' },
  { title: 'Resistance Bands Set', description: 'Exercise bands for home workouts', category: 'Sports' },
  { title: 'Jump Rope Premium', description: 'Adjustable speed jump rope', category: 'Sports' },
  { title: 'Fitness Tracker Band', description: 'Replacement fitness tracker strap', category: 'Sports' },
  // Special Arsenal 3rd Kit Auction - user@arsenal
  { title: 'Arsenal 25/26 3rd Kit', description: 'Official Arsenal 2025/2026 third kit - authentic player version', category: 'Sports' },
  
  // Books (Under 5Pi)
  { title: 'Bestseller Book Collection', description: '3 popular paperback books', category: 'Books' },
  { title: 'Notebook Set Premium', description: 'High-quality writing notebooks', category: 'Books' },
  { title: 'Bookmark Collection', description: 'Artistic metal bookmarks', category: 'Books' },
  { title: 'Reading Light Clip', description: 'Portable book reading light', category: 'Books' },
  { title: 'Journal Vintage Style', description: 'Leather-bound writing journal', category: 'Books' },
  
  // Art (Under 5Pi)
  { title: 'Art Print Set', description: 'Gallery-quality art prints', category: 'Art' },
  { title: 'Paint Brush Collection', description: 'Professional artist brushes', category: 'Art' },
  { title: 'Sketchbook Premium', description: 'Artist-quality drawing pad', category: 'Art' },
  { title: 'Craft Supply Bundle', description: 'DIY craft materials kit', category: 'Art' },
  { title: 'Coloring Book Adult', description: 'Stress-relief coloring book', category: 'Art' },
  
  // Jewelry (Under 5Pi)
  { title: 'Silver Chain Necklace', description: 'Sterling silver chain', category: 'Jewelry' },
  { title: 'Earrings Collection', description: 'Fashion earring set', category: 'Jewelry' },
  { title: 'Bracelet Handmade', description: 'Artisan-crafted bracelet', category: 'Jewelry' },
  { title: 'Ring Adjustable', description: 'Stainless steel fashion ring', category: 'Jewelry' },
  { title: 'Jewelry Box Organizer', description: 'Compact jewelry storage box', category: 'Jewelry' },
  
  // Collectibles (Under 5Pi)
  { title: 'Trading Card Pack', description: 'Rare collectible cards', category: 'Collectibles' },
  { title: 'Coin Collection Set', description: 'Historical commemorative coins', category: 'Collectibles' },
  { title: 'Stamp Collection', description: 'Vintage postage stamps', category: 'Collectibles' },
  { title: 'Miniature Figure', description: 'Collectible action figure', category: 'Collectibles' },
  { title: 'Badge Collection', description: 'Vintage enamel pins', category: 'Collectibles' }
];

// Edge case scenarios
const EDGE_CASES = {
  // Normal auctions
  normal: {
    startPrice: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5],
    bidPatterns: ['gradual', 'competitive', 'single_bidder']
  },
  
  // Max bid scenarios
  maxBid: {
    startPrice: [0.1, 0.5, 1.0],
    maxBidMultiplier: [2, 3, 5, 10],
    bidPatterns: ['max_bid_early', 'max_bid_late', 'multiple_max_bids']
  },
  
  // Sniping scenarios
  sniping: {
    startPrice: [0.5, 1.0, 2.0],
    bidPatterns: ['last_minute', 'last_30_seconds', 'last_10_seconds']
  },
  
  // Competitive scenarios
  competitive: {
    startPrice: [0.5, 1.0, 1.5],
    bidPatterns: ['back_forth', 'rapid_fire', 'incremental']
  },
  
  // Edge cases
  edgeCases: {
    startPrice: [0.01, 0.05, 0.1], // Very low starting prices
    bidPatterns: ['no_bids', 'single_bid', 'minimum_increments']
  }
};

// Generate random price under 5Pi
function generatePriceUnder5Pi(): number {
  const basePrice = Math.random() * 4.9; // 0 to 4.9
  return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
}

// Generate auction expiration time (1 hour from now)
function generateExpirationTime(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
}

// Generate mock image URLs
function generateImageUrl(itemTitle: string, index: number): string {
  const seed = itemTitle.replace(/\s+/g, '').toLowerCase() + index;
  return `https://picsum.photos/seed/${seed}/400/400`;
}

// Create comprehensive auction with edge cases
async function createComprehensiveAuction(
  item: any, 
  seller: any, 
  scenario: string, 
  userPool: any[],
  auctionIndex: number
) {
  const startPrice = generatePriceUnder5Pi();
  const expirationTime = generateExpirationTime();
  
  // Create auction
  const auction = await prisma.auctions.create({
    data: {
      title: item.title,
      description: item.description,
      currentBid: startPrice,
      seller_id: seller.id,
      category: item.category,
      status: 'OPEN',
      expires_at: expirationTime,
      starts_at: new Date()
    }
  });

  // Add images
  await prisma.auction_images.create({
    data: {
      url: generateImageUrl(item.title, auctionIndex),
      auctionId: auction.id
    }
  });

  // Generate realistic bidding scenarios based on scenario type
  await generateBiddingScenario(auction, seller, scenario, userPool, startPrice);

  return auction;
}

// Generate realistic bidding scenarios
async function generateBiddingScenario(
  auction: any, 
  seller: any, 
  scenario: string, 
  userPool: any[], 
  startPrice: number
) {
  const now = new Date();
  const timeRemaining = auction.expires_at.getTime() - now.getTime();
  
  switch (scenario) {
    case 'normal':
      await generateNormalBidding(auction, userPool, startPrice);
      break;
    case 'max_bid':
      await generateMaxBidScenario(auction, userPool, startPrice);
      break;
    case 'sniping':
      await generateSnipingScenario(auction, userPool, startPrice, timeRemaining);
      break;
    case 'competitive':
      await generateCompetitiveScenario(auction, userPool, startPrice);
      break;
    case 'edge_case':
      await generateEdgeCaseScenario(auction, userPool, startPrice);
      break;
  }
}

// Normal bidding pattern
async function generateNormalBidding(auction: any, userPool: any[], startPrice: number) {
  const numBidders = Math.floor(Math.random() * 4) + 2; // 2-5 bidders
  const selectedUsers = userPool.slice(0, numBidders);
  
  let currentBid = startPrice;
  const numBids = Math.floor(Math.random() * 8) + 3; // 3-10 bids
  
  for (let i = 0; i < numBids; i++) {
    const bidder = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
    const increment = Math.random() * 0.5 + 0.1; // 0.1 to 0.6 increment
    currentBid = Math.round((currentBid + increment) * 100) / 100;
    
    if (currentBid >= 5.0) break; // Stay under 5Pi
    
    await prisma.bids.create({
      data: {
        amount: currentBid,
        bidder_id: bidder.id,
        auctionId: auction.id,
        pi_payment_id: `pay_mock_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - (numBids - i) * 60000) // Spread over time
      }
    });
  }
}

// Max bid scenarios
async function generateMaxBidScenario(auction: any, userPool: any[], startPrice: number) {
  const numBidders = Math.floor(Math.random() * 3) + 2; // 2-4 bidders
  const selectedUsers = userPool.slice(0, numBidders);
  
  // Create initial bids
  let currentBid = startPrice;
  
  // Add max bids
  for (const user of selectedUsers) {
    const maxBidAmount = Math.min(startPrice * (Math.random() * 3 + 2), 4.9); // 2-4x start price, max 4.9
    
    await prisma.auto_bids.create({
      data: {
        auction_id: auction.id,
        bidder_id: user.id,
        max_amount: Math.round(maxBidAmount * 100) / 100,
        created_at: new Date(Date.now() - Math.random() * 300000) // Within last 5 minutes
      }
    });
  }
  
  // Add some regular bids to trigger auto-bidding
  for (let i = 0; i < 3; i++) {
    const increment = Math.random() * 0.3 + 0.1;
    currentBid = Math.round((currentBid + increment) * 100) / 100;
    
    if (currentBid >= 5.0) break;
    
    const bidder = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
    await prisma.bids.create({
      data: {
        amount: currentBid,
        bidder_id: bidder.id,
        auctionId: auction.id,
        pi_payment_id: `pay_mock_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - (3 - i) * 30000)
      }
    });
  }
}

// Sniping scenarios
async function generateSnipingScenario(auction: any, userPool: any[], startPrice: number, timeRemaining: number) {
  const numBidders = Math.floor(Math.random() * 3) + 2; // 2-4 bidders
  const selectedUsers = userPool.slice(0, numBidders);
  
  // Normal bidding for most of the auction
  let currentBid = startPrice;
  
  // Add some early bids
  for (let i = 0; i < 2; i++) {
    const increment = Math.random() * 0.2 + 0.1;
    currentBid = Math.round((currentBid + increment) * 100) / 100;
    
    const bidder = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
    await prisma.bids.create({
      data: {
        amount: currentBid,
        bidder_id: bidder.id,
        auctionId: auction.id,
        pi_payment_id: `pay_mock_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - 300000 - i * 60000) // 5+ minutes ago
      }
    });
  }
  
  // Sniping bids in the last minute
  const snipeTimes = [30, 15, 5, 1]; // Seconds before end
  
  for (const seconds of snipeTimes) {
    if (timeRemaining > seconds * 1000) {
      const sniper = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
      const increment = Math.random() * 0.5 + 0.2;
      currentBid = Math.round((currentBid + increment) * 100) / 100;
      
      if (currentBid >= 5.0) break;
      
      await prisma.bids.create({
        data: {
          amount: currentBid,
          bidder_id: sniper.id,
          auctionId: auction.id,
          pi_payment_id: `pay_mock_${Date.now()}_snipe_${seconds}`,
          created_at: new Date(Date.now() - seconds * 1000)
        }
      });
    }
  }
}

// Competitive scenarios
async function generateCompetitiveScenario(auction: any, userPool: any[], startPrice: number) {
  const numBidders = Math.floor(Math.random() * 4) + 3; // 3-6 bidders
  const selectedUsers = userPool.slice(0, numBidders);
  
  let currentBid = startPrice;
  const numBidRounds = Math.floor(Math.random() * 5) + 3; // 3-7 rounds
  
  for (let round = 0; round < numBidRounds; round++) {
    // Each bidder tries to outbid in rapid succession
    for (const user of selectedUsers) {
      const increment = Math.random() * 0.3 + 0.05; // Small increments
      currentBid = Math.round((currentBid + increment) * 100) / 100;
      
      if (currentBid >= 5.0) break;
      
      await prisma.bids.create({
        data: {
          amount: currentBid,
          bidder_id: user.id,
          auctionId: auction.id,
          pi_payment_id: `pay_mock_${Date.now()}_${round}_${user.id}`,
          created_at: new Date(Date.now() - (numBidRounds - round) * 10000 - Math.random() * 5000)
        }
      });
    }
    
    if (currentBid >= 5.0) break;
  }
}

// Edge case scenarios
async function generateEdgeCaseScenario(auction: any, userPool: any[], startPrice: number) {
  const scenarioType = Math.floor(Math.random() * 4);
  
  switch (scenarioType) {
    case 0: // No bids
      // Leave auction with no bids
      break;
      
    case 1: // Single bid
      const singleBidder = userPool[0];
      await prisma.bids.create({
        data: {
          amount: startPrice + 0.01,
          bidder_id: singleBidder.id,
          auctionId: auction.id,
          pi_payment_id: `pay_mock_${Date.now()}_single`,
          created_at: new Date(Date.now() - 60000)
        }
      });
      break;
      
    case 2: // Minimum increments
      const minBidder = userPool[0];
      let currentBid = startPrice;
      
      for (let i = 0; i < 5; i++) {
        currentBid = Math.round((currentBid + 0.01) * 100) / 100; // Minimum increments
        if (currentBid >= 5.0) break;
        
        await prisma.bids.create({
          data: {
            amount: currentBid,
            bidder_id: minBidder.id,
            auctionId: auction.id,
            pi_payment_id: `pay_mock_${Date.now()}_min_${i}`,
            created_at: new Date(Date.now() - (5 - i) * 10000)
          }
        });
      }
      break;
      
    case 3: // Very low starting price with rapid escalation
      let lowBid = startPrice;
      const bidders = userPool.slice(0, 2);
      
      for (let i = 0; i < 3; i++) {
        const multiplier = Math.random() * 2 + 1.5; // 1.5-3.5x multiplier
        lowBid = Math.round(lowBid * multiplier * 100) / 100;
        
        if (lowBid >= 5.0) {
          lowBid = 4.99; // Cap at 4.99
          break;
        }
        
        const bidder = bidders[i % bidders.length];
        await prisma.bids.create({
          data: {
            amount: lowBid,
            bidder_id: bidder.id,
            auctionId: auction.id,
            pi_payment_id: `pay_mock_${Date.now()}_escalate_${i}`,
            created_at: new Date(Date.now() - (3 - i) * 20000)
          }
        });
      }
      break;
  }
}

/**
 * 🏆 Create special Arsenal 3rd Kit auction
 * Created by user@arsenal with 3Pi starting price and 3-minute duration
 */
async function createSpecialArsenalAuction() {
  console.log('🏆 Creating special Arsenal 3rd Kit auction...');
  
  // Create auction with specific parameters
  const arsenalAuction = await prisma.auctions.create({
    data: {
      title: 'Arsenal 25/26 3rd Kit',
      description: 'Official Arsenal 2025/2026 third kit - authentic player version, brand new with tags',
      currentBid: 3.0, // 3Pi starting price as requested
      seller_id: 'user@arsenal',
      category: 'Sports',
      status: 'OPEN',
      expires_at: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
      starts_at: new Date()
    }
  });

  // Add Arsenal kit image
  await prisma.auction_images.create({
    data: {
      url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&h=400&fit=crop&crop=center&txt=Arsenal+3rd+Kit&txt-color=white&txt-size=20&txt-align=center&txt-font=Arial',
      auctionId: arsenalAuction.id
    }
  });

  // Add some competitive bidding to make it interesting
  const bidders = ['test_user_1', 'test_user_2', 'test_user_3'];
  let currentBid = 3.0;
  
  for (let i = 0; i < 5; i++) {
    const increment = Math.random() * 0.5 + 0.1; // 0.1 to 0.6 increment
    currentBid = Math.round((currentBid + increment) * 100) / 100;
    
    if (currentBid >= 5.0) break; // Stay under 5Pi
    
    const bidder = bidders[i % bidders.length];
    await prisma.bids.create({
      data: {
        amount: currentBid,
        bidder_id: bidder,
        auctionId: arsenalAuction.id,
        pi_payment_id: `pay_mock_arsenal_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - (5 - i) * 30000) // Spread over 2.5 minutes
      }
    });
  }

  // Add max bids for sniping simulation
  await prisma.auto_bids.create({
    data: {
      auction_id: arsenalAuction.id,
      bidder_id: 'test_user_4',
      max_amount: 4.5,
      created_at: new Date(Date.now() - 60000) // 1 minute ago
    }
  });

  await prisma.auto_bids.create({
    data: {
      auction_id: arsenalAuction.id,
      bidder_id: 'test_user_5',
      max_amount: 4.8,
      created_at: new Date(Date.now() - 30000) // 30 seconds ago
    }
  });

  console.log(`✅ Arsenal 3rd Kit auction created: #${arsenalAuction.id}`);
  console.log(`📊 Starting price: 3π, Current bid: ${currentBid}π`);
  console.log(`⏰ Expires in: 3 minutes`);
  
  return arsenalAuction;
}

/**
 * 🛍️ Create Fashion Auction for Chat Testing
 * Created by user@arsenal for 5-minute duration in Fashion category
 */
async function createFashionChatAuction() {
  console.log('🛍️ Creating Fashion auction for chat testing...');
  
  // Create auction with specific parameters for chat testing
  const fashionAuction = await prisma.auctions.create({
    data: {
      title: 'Designer Handbag - Chat Test',
      description: 'Premium designer handbag perfect for testing chat functionality between seller and winner. Authentic leather with gold hardware.',
      currentBid: 2.5, // 2.5Pi starting price
      seller_id: 'user@arsenal',
      category: 'Fashion',
      status: 'OPEN',
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      starts_at: new Date()
    }
  });

  // Add fashion item image
  await prisma.auction_images.create({
    data: {
      url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&h=400&fit=crop&crop=center&txt=Designer+Handbag&txt-color=white&txt-size=20&txt-align=center&txt-font=Arial',
      auctionId: fashionAuction.id
    }
  });

  // Add some competitive bidding to make it interesting
  const bidders = ['test_user_1', 'test_user_2', 'test_user_3'];
  let currentBid = 2.5;
  
  for (let i = 0; i < 3; i++) {
    const increment = Math.random() * 0.3 + 0.1; // 0.1 to 0.4 increment
    currentBid = Math.round((currentBid + increment) * 100) / 100;
    
    if (currentBid >= 4.5) break; // Stay under 5Pi
    
    const bidder = bidders[i % bidders.length];
    await prisma.bids.create({
      data: {
        amount: currentBid,
        bidder_id: bidder,
        auctionId: fashionAuction.id,
        pi_payment_id: `pay_mock_fashion_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - (4 - i) * 45000) // Spread over 3 minutes
      }
    });
  }

  // Add max bids for sniping simulation
  await prisma.auto_bids.create({
    data: {
      auction_id: fashionAuction.id,
      bidder_id: 'test_user_4',
      max_amount: 3.8,
      created_at: new Date(Date.now() - 90000) // 1.5 minutes ago
    }
  });

  await prisma.auto_bids.create({
    data: {
      auction_id: fashionAuction.id,
      bidder_id: 'test_user_5',
      max_amount: 4.2,
      created_at: new Date(Date.now() - 45000) // 45 seconds ago
    }
  });

  console.log(`✅ Fashion Chat Auction created: #${fashionAuction.id}`);
  console.log(`📊 Starting price: 2.5π, Current bid: ${currentBid}π`);
  console.log(`⏰ Expires in: 5 minutes`);
  console.log(`💬 Perfect for testing seller-winner chat functionality`);
  
  return fashionAuction;
}

// Main seeding function
async function seedComprehensiveAuctions() {
  console.log('🚀 Starting comprehensive auction seeding...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing auction data...');
    await prisma.bids.deleteMany({});
    await prisma.auto_bids.deleteMany({});
    await prisma.auction_images.deleteMany({});
    await prisma.escrow_ledger.deleteMany({});
    await prisma.messages.deleteMany({});
    await prisma.auctions.deleteMany({});
    
    console.log('✅ Database cleared successfully');
    
    // Create test users if they don't exist
    console.log('👥 Creating test users...');
    for (const user of TEST_USERS) {
      // Skip user creation since we're using mock users
      console.log(`✅ Test user ready: ${user.username}`);
    }
    
    console.log('📦 Creating 100 comprehensive auctions...');
    const createdAuctions = [];
    
    // Distribute scenarios across 100 auctions
    const scenarioDistribution = {
      normal: 35,      // 35 normal auctions
      maxBid: 25,      // 25 max bid scenarios
      sniping: 20,     // 20 sniping scenarios
      competitive: 15, // 15 competitive scenarios
      edge_case: 5     // 5 edge case scenarios
    };
    
    let auctionIndex = 0;
    
    // Create auctions for each scenario type
    for (const [scenario, count] of Object.entries(scenarioDistribution)) {
      console.log(`🎯 Creating ${count} ${scenario.replace('_', ' ')} auctions...`);
      
      for (let i = 0; i < count; i++) {
        const itemIndex = auctionIndex % SAMPLE_ITEMS.length;
        const item = SAMPLE_ITEMS[itemIndex];
        const seller = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
        
        try {
          const auction = await createComprehensiveAuction(
            item,
            seller,
            scenario,
            TEST_USERS,
            auctionIndex
          );
          
          createdAuctions.push(auction);
          auctionIndex++;
          
          if (auctionIndex % 10 === 0) {
            console.log(`✅ Created ${auctionIndex}/100 auctions...`);
          }
        } catch (error) {
          console.error(`❌ Error creating auction ${auctionIndex}:`, error);
        }
      }
    }
    
    // Create special Arsenal 3rd Kit auction
    console.log('🏆 Creating special Arsenal 3rd Kit auction...');
    const arsenalAuction = await createSpecialArsenalAuction();
    createdAuctions.push(arsenalAuction);
    
    // Create Fashion auction for chat testing
    console.log('🛍️ Creating Fashion auction for chat testing...');
    const fashionAuction = await createFashionChatAuction();
    createdAuctions.push(fashionAuction);
    
    console.log('📊 Seeding complete! Summary:');
    console.log(`✅ Total auctions created: ${createdAuctions.length}`);
    
    // Generate summary statistics
    const stats = await generateAuctionStats();
    console.log('\n📈 Auction Statistics:');
    console.log(stats);
    
    // Create test guide
    await createTestGuide();
    
    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Run the app and check the Market view');
    console.log('2. Test different user scenarios in My Bids');
    console.log('3. Try the enhanced Max Bid functionality');
    console.log('4. Test the winner badge trophy icon');
    console.log('5. Monitor console for real-time updates');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Generate auction statistics
async function generateAuctionStats() {
  const totalAuctions = await prisma.auctions.count();
  const totalBids = await prisma.bids.count();
  const totalAutoBids = await prisma.auto_bids.count();
  const avgBidsPerAuction = totalBids / totalAuctions;
  
  const categoryStats = await prisma.auctions.groupBy({
    by: ['category'],
    _count: { id: true },
    _avg: { currentBid: true }
  });
  
  const statusStats = await prisma.auctions.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  
  return {
    totalAuctions,
    totalBids,
    totalAutoBids,
    avgBidsPerAuction: avgBidsPerAuction.toFixed(2),
    categories: categoryStats,
    statuses: statusStats
  };
}

// Create comprehensive test guide
async function createTestGuide() {
  const guide = `
# 🎯 COMPREHENSIVE AUCTION TEST GUIDE

## ✅ What's Been Seeded

- **100 Auctions** across all categories
- **All under 5Pi** (0.01 to 4.99 Pi)
- **1-hour duration** from creation time
- **Multiple test users** with different behaviors
- **Edge case scenarios** for thorough testing

## 📊 Auction Distribution

- **Normal Auctions**: 35 auctions with gradual bidding
- **Max Bid Scenarios**: 25 auctions with auto-bids
- **Sniping Scenarios**: 20 auctions with last-minute bids
- **Competitive Scenarios**: 15 auctions with rapid bidding
- **Edge Cases**: 5 auctions with special conditions
- **Special Arsenal Auction**: 1 premium auction (3Pi start, 3min duration)
- **Fashion Chat Auction**: 1 auction for chat testing (2.5Pi start, 5min duration)

## 👥 Test Users

${TEST_USERS.map(user => `- **${user.username}** (${user.name})`).join('\n')}

## 🧪 Test Scenarios

### 1. Normal Bidding
- Browse auctions in Market view
- Place normal bids on items
- Watch bidding progression
- Test winner badge changes

### 2. Max Bid Testing
- Set max bids on auctions
- Test auto-bid functionality
- Verify max bid validation
- Check enhanced Max Bid UI

### 3. Sniping Testing
- Wait for auctions to end
- Watch last-minute bidding
- Test real-time updates
- Verify winner notifications

### 4. Competitive Scenarios
- Bid on competitive auctions
- Test rapid bid updates
- Verify bid ordering
- Test auto-bid conflicts

### 5. Edge Cases
- Test auctions with no bids
- Test single bid scenarios
- Test minimum increments
- Test very low starting prices

### 6. Special Arsenal Auction
- **Item**: Arsenal 25/26 3rd Kit
- **Seller**: user@arsenal
- **Starting Price**: 3π
- **Duration**: 3 minutes
- **Features**: Competitive bidding, max bids, sniping simulation
- **Test**: Real-time bidding, auto-bid conflicts, winner determination

### 7. Fashion Chat Auction
- **Item**: Designer Handbag - Chat Test
- **Seller**: user@arsenal
- **Starting Price**: 2.5π
- **Duration**: 5 minutes
- **Category**: Fashion
- **Features**: Perfect for testing seller-winner chat functionality
- **Test**: Chat messaging, bid notifications, winner communication

## 🚀 Browser Console Testing

### Test Winner Badge
\`\`\`javascript
window.runWinnerBadgeTest();
\`\`\`

### Test Max Bid Functionality
\`\`\`javascript
window.runEnhancedMaxBidTest();
\`\`\`

### Test Specific Scenarios
\`\`\`javascript
// Test normal bidding
window.testWinnerBadge();

// Test max bid validation
window.testMaxBidValidation();

// Test UI enhancements
window.testMaxBidUI();

// Test chat functionality
window.testSellerWinnerChat();

// Test specific auctions
window.testArsenalAuction();
window.testFashionChatAuction();
```
\`\`\`

## 📈 Expected Results

- **Winner badges** should show gold trophy icon for ended auctions
- **Max bid validation** should provide real-time feedback
- **Auto-bids** should trigger automatically when outbid
- **Sniping** should show rapid bidding in last minute
- **All auctions** should stay under 5Pi limit

## 🔍 Monitoring

Watch console for:
- Real-time bid updates
- Auto-bid processing logs
- Winner badge changes
- Settlement notifications

## 🎉 Happy Testing!
`;

  console.log(guide);
  
  // Save guide to file
  try {
    const fs = await import('fs');
    fs.writeFileSync('COMPREHENSIVE_TEST_GUIDE.md', guide);
    console.log('\n📄 Test guide saved to: COMPREHENSIVE_TEST_GUIDE.md');
  } catch (error) {
    console.log('\n📄 Test guide content (file save skipped):');
    console.log(guide);
  }
}

// Run the seeding
seedComprehensiveAuctions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedComprehensiveAuctions };