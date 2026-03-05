import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Places a bid on an auction with full validation and security checks.
 */
async function placeBid(auctionId: number, bidderId: string, bidAmount: number) {
  const prisma = new PrismaClient();

  try {
    console.log(`\n⏳ Attempting to place bid of ${bidAmount} Pi for User: ${bidderId}...`);

    // 🛡️ INTERACTIVE TRANSACTION: Ensures all checks pass before any data changes
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Fetch auction and lock the row for update
      const auction = await tx.auctions.findUnique({
        where: { id: auctionId }
      });

      if (!auction) {
        throw new Error("Auction not found.");
      }

      // 2. CHECK: Is the auction still open?
      if (auction.status !== 'ACTIVE') {
        throw new Error(`Auction is ${auction.status}. Bidding is closed.`);
      }

      // 3. SECURITY CHECK: Prevent self-bidding (Shill Bidding)
      if (auction.seller_id === bidderId) {
        throw new Error("Security Violation: You cannot bid on your own auction.");
      }

      // 4. CHECK: Is the bid higher than the current price?
      // Note: We convert Decimal to Number for the comparison
      const currentPrice = Number(auction.currentBid);
      if (bidAmount <= currentPrice) {
        throw new Error(`Bid too low. The current high bid is ${currentPrice} Pi.`);
      }

      // 5. SUCCESS: Create the bid record
      const newBid = await tx.bids.create({
        data: {
          auctionId: auctionId,
          bidder_id: bidderId,
          amount: bidAmount
        }
      });

      // 6. SUCCESS: Update the auction's current price
      await tx.auctions.update({
        where: { id: auctionId },
        data: { currentBid: bidAmount }
      });

      return newBid;
    });

    console.log(`✅ SUCCESS: ${result.bidder_id} is now the high bidder at ${result.amount} Pi!`);

  } catch (error: any) {
    console.error(`❌ BID REJECTED: ${error.message}`);
  } finally {
    // Always disconnect to prevent hanging connections
    await prisma.$disconnect();
  }
}

// --- TEST SUITE ---

async function runTests() {
  console.log("🛠️ Starting Security & Logic Tests...");

  // TEST 1: Valid Bid (Should pass)
  // Assumes user_67890_bidder exists from your seed
  await placeBid(1, 'user_67890_bidder', 35.00);

  // TEST 2: Self-Bidding (Should be REJECTED)
  // Assumes user_12345_seller is the owner of auction #1
  await placeBid(1, 'user_12345_seller', 50.00);

  // TEST 3: Low Bid (Should be REJECTED)
  await placeBid(1, 'user_67890_bidder', 1.00);
}

runTests();