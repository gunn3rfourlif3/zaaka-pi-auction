import { PrismaClient } from '@prisma/client';
import { getApiBaseUrl } from '../lib/server-url';

const prisma = new PrismaClient();

const MIN_INCREMENT = 0.1;

export async function processAutoBids(auctionId: number, req?: any) {
  console.log(`🤖 Processing Auto-Bids for Auction #${auctionId}`);

  // 1. Get the current state of the auction
  const auction = await prisma.auctions.findUnique({
    where: { id: auctionId },
    include: { 
      bids: { orderBy: { amount: 'desc' }, take: 1 },
      auto_bids: { orderBy: { max_amount: 'desc' } } // Get all auto-bids
    }
  });

  if (!auction) {
    console.log(`❌ Auction #${auctionId} not found`);
    return;
  }

  if (auction.status !== 'OPEN') {
    console.log(`⚠️ Auction #${auctionId} is not open (status: ${auction.status})`);
    return;
  }

  // Check if auction has expired
  const now = new Date();
  if (new Date(auction.expires_at) < now) {
    console.log(`⏰ Auction #${auctionId} has expired`);
    return;
  }

  const currentPrice = Number(auction.currentBid);
  const winningBid = auction.bids[0];
  const winningBidderId = winningBid?.bidder_id;
  
  // Filter out auto-bids that are exhausted or belong to the current winner
  // Actually, we need to check ALL auto-bids to see if anyone can beat the current price.
  // But usually, the current winner might have an auto-bid too.

  // Enhanced auto-bid filtering with better logic
  const activeAutoBids = auction.auto_bids.filter(ab => {
    const maxAmount = Number(ab.max_amount);
    // Check if auto-bid is still valid (not expired and amount > current price)
    return maxAmount > currentPrice && maxAmount > 0;
  });

  if (activeAutoBids.length === 0) {
    console.log("No active auto-bids capable of beating current price.");
    return;
  }

  // Sort by max_amount DESC, then by created_at ASC (earlier bids take precedence)
  activeAutoBids.sort((a, b) => {
    const maxA = Number(a.max_amount);
    const maxB = Number(b.max_amount);
    if (maxA !== maxB) return maxB - maxA; // Higher max amount first
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Earlier created first
  });

  // 2. Identify the highest active auto-bidder who is NOT the current winner
  const potentialWinners = activeAutoBids.filter(ab => ab.bidder_id !== winningBidderId);

  if (potentialWinners.length === 0) {
    console.log("Current winner holds the highest active auto-bid.");
    return;
  }

  const challenger = potentialWinners[0]; // Highest max bid among non-winners
  const challengerMax = Number(challenger.max_amount);

  // Check if the current winner also has an auto-bid
  const currentWinnerAutoBid = activeAutoBids.find(ab => ab.bidder_id === winningBidderId);
  const currentWinnerMax = currentWinnerAutoBid ? Number(currentWinnerAutoBid.max_amount) : currentPrice;

  // 3. Resolve the battle with enhanced logic
  // Scenario A: Challenger has higher max than Current Winner
  if (challengerMax > currentWinnerMax) {
    // Challenger wins. 
    // Price becomes: CurrentWinnerMax + Increment (capped at ChallengerMax)
    let newPrice = currentWinnerMax + MIN_INCREMENT;
    if (newPrice > challengerMax) newPrice = challengerMax;

    console.log(`🎯 Challenger wins! New price: ${newPrice} π (Challenger max: ${challengerMax})`);
    await placeSystemBid(auctionId, challenger.bidder_id, newPrice);
    
    // Recursive call to handle any remaining auto-bidders
    return processAutoBids(auctionId);
  }

  // Scenario B: Current Winner has higher (or equal) max than Challenger
  if (currentWinnerMax >= challengerMax) {
    // Current Winner stays winning, but price goes up to defeat Challenger.
    // Price becomes: ChallengerMax + Increment (capped at CurrentWinnerMax)
    let newPrice = challengerMax + MIN_INCREMENT;
    if (newPrice > currentWinnerMax) newPrice = currentWinnerMax;

    // Enhanced optimization: Check if new price would be meaningful
    if (newPrice <= currentPrice) {
      console.log(`⚖️ Price equilibrium reached at ${currentPrice} π`);
      return;
    }

    console.log(`🎯 Current winner defends! New price: ${newPrice} π (Winner max: ${currentWinnerMax})`);
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

  // Emit bid update via multi-layered system (HTTP polling + Socket.IO)
  try {
      const baseUrl = getApiBaseUrl(req);
      
      // Try HTTP polling first (works with ngrok)
      await fetch(`${baseUrl}/api/http-poll?action=update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              auctionId: Number(auctionId),
              newBid: Number(amount),
              bidder: bidderId,
              type: 'bid_update'
          })
      });
      console.log(`🎯 Auto-bid emitted via HTTP polling: Auction ${auctionId}, Bid ${amount} by ${bidderId}`);
      
      // Also try Socket.IO (fallback for localhost)
      await fetch(`${baseUrl}/api/emit-bid-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              auctionId: Number(auctionId),
              newBid: Number(amount),
              bidder: bidderId
          })
      });
      console.log(`🎯 Auto-bid emitted via Socket.IO: Auction ${auctionId}, Bid ${amount} by ${bidderId}`);
  } catch (emitError) {
      console.error('❌ Failed to emit auto-bid update:', emitError);
  }
}
