import { PrismaClient } from '@prisma/client';
// Use absolute path alias if configured, or just copy the function here for testing if imports are tricky
const prisma = new PrismaClient();

const MIN_INCREMENT = 0.1;

// Copied from services/auto_bid_service.ts to bypass import issues in script runner
async function processAutoBids(auctionId: number) {
  console.log(`🤖 Processing Auto-Bids for Auction #${auctionId}`);

  // 1. Get the current state of the auction
  const auction = await prisma.auctions.findUnique({
    where: { id: auctionId },
    include: { 
      bids: { orderBy: { amount: 'desc' }, take: 1 },
      auto_bids: { orderBy: { max_amount: 'desc' } } // Get all auto-bids
    }
  });

  if (!auction || auction.status !== 'OPEN') return;

  const currentPrice = Number(auction.currentBid);
  const winningBid = auction.bids[0];
  const winningBidderId = winningBid?.bidder_id;
  
  const activeAutoBids = auction.auto_bids.filter(ab => Number(ab.max_amount) > currentPrice);

  if (activeAutoBids.length === 0) {
    console.log("No active auto-bids capable of beating current price.");
    return;
  }

  const potentialWinners = activeAutoBids.filter(ab => ab.bidder_id !== winningBidderId);

  if (potentialWinners.length === 0) {
    console.log("Current winner holds the only active auto-bid.");
    return;
  }

  const challenger = potentialWinners[0]; // Highest max bid among non-winners
  const challengerMax = Number(challenger.max_amount);

  const currentWinnerAutoBid = activeAutoBids.find(ab => ab.bidder_id === winningBidderId);
  const currentWinnerMax = currentWinnerAutoBid ? Number(currentWinnerAutoBid.max_amount) : currentPrice;

  if (challengerMax > currentWinnerMax) {
    let newPrice = currentWinnerMax + MIN_INCREMENT;
    if (newPrice > challengerMax) newPrice = challengerMax;

    await placeSystemBid(auctionId, challenger.bidder_id, newPrice);
    return processAutoBids(auctionId);
  }

  if (currentWinnerMax >= challengerMax) {
    let newPrice = challengerMax + MIN_INCREMENT;
    if (newPrice > currentWinnerMax) newPrice = currentWinnerMax;

    if (newPrice <= currentPrice) {
      console.log("Price equilibrium reached.");
      return;
    }

    await placeSystemBid(auctionId, winningBidderId!, newPrice);
    return processAutoBids(auctionId);
  }
}

async function placeSystemBid(auctionId: number, bidderId: string, amount: number) {
  console.log(`⚡ Placing Auto-Bid: ${amount} Pi by ${bidderId}`);
  
  await prisma.$transaction([
    prisma.auctions.update({
      where: { id: auctionId },
      data: { currentBid: amount }
    }),
    prisma.bids.create({
      data: {
        amount: amount,
        bidder_id: bidderId,
        pi_payment_id: `auto_bid_${Date.now()}_${Math.random()}`,
        auction: { connect: { id: auctionId } }
      }
    })
  ]);
}

async function testMaxBidLogic() {
  console.log("🧪 Starting Max Bid Logic Test...");

  // 1. Create a fresh test auction
  // We use a mock seller ID since 'users' table is not in the schema provided
  const sellerId = "test_seller_" + Date.now();

  const auction = await prisma.auctions.create({
    data: {
      title: "Test Max Bid Item " + Date.now(),
      description: "Testing auto-bid logic",
      // startPrice removed as it is not in schema
      currentBid: 10.0,
      seller_id: sellerId,
      category: "Test",
      expires_at: new Date(Date.now() + 3600000), // 1 hour
      // image_url removed as it is likely not in schema, checking Prisma
      // If schema has auction_images relation, we should use that, but for basic test we can skip
    }
  });

  console.log(`✅ Created Auction #${auction.id} at 10.0 Pi`);

  // 2. User A places a bid of 12, with Max Bid 50
  console.log("\n👤 User A bids 12 (Max 50)...");
  
  // Simulate the API logic for User A
  await prisma.$transaction(async (tx) => {
    await tx.auctions.update({
        where: { id: auction.id },
        data: { currentBid: 12.0 }
    });
    await tx.bids.create({
        data: {
            amount: 12.0,
            bidder_id: "UserA",
            pi_payment_id: "test_pay_A",
            auction: { connect: { id: auction.id } }
        }
    });
    await tx.auto_bids.create({
        data: {
            auction_id: auction.id,
            bidder_id: "UserA",
            max_amount: 50.0
        }
    });
  });

  // Trigger processing (should be no-op as they are winning)
  await processAutoBids(auction.id);
  
  let updatedAuction = await prisma.auctions.findUnique({ where: { id: auction.id } });
  console.log(`👉 Current Price: ${updatedAuction?.currentBid} (Winner: UserA)`);


  // 3. User B places a bid of 15 (No Max Bid)
  console.log("\n👤 User B bids 15...");
  
  // Simulate API logic for User B
  await prisma.$transaction(async (tx) => {
    await tx.auctions.update({
        where: { id: auction.id },
        data: { currentBid: 15.0 }
    });
    await tx.bids.create({
        data: {
            amount: 15.0,
            bidder_id: "UserB",
            pi_payment_id: "test_pay_B",
            auction: { connect: { id: auction.id } }
        }
    });
  });

  // Trigger processing (User A should auto-bid to 15.1)
  console.log("⚙️ Triggering Auto-Bid Logic...");
  await processAutoBids(auction.id);

  // We must re-fetch with include to see the bids
  const finalAuction = await prisma.auctions.findUnique({ 
      where: { id: auction.id },
      include: { bids: { orderBy: { created_at: 'desc' }, take: 1 } }
  });

  console.log(`\n✅ RESULT: Current Price: ${finalAuction?.currentBid}`);
  const winner = finalAuction?.bids[0]?.bidder_id;
  console.log(`🏆 Winning Bidder: ${winner}`);

  if (Number(finalAuction?.currentBid) === 15.1 && winner === 'UserA') {
      console.log("✅ TEST PASSED: User A automatically outbid User B.");
  } else {
      console.error("❌ TEST FAILED: Auto-bid did not trigger correctly.");
  }
}

testMaxBidLogic()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
