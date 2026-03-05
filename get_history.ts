import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function getAuctionLeaderboard(auctionId: number) {
  const prisma = new PrismaClient();

  try {
    const auction = await prisma.auctions.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' }, // 🏆 Highest bid first
          // include: {
          //   users: { // 👤 Get the username from the 'users' table - not available
          //     select: { username: true, zaaka_trust_score: true }
          //   }
          // }
        }
      }
    });

    if (!auction) {
      console.log("❌ Auction not found.");
      return;
    }

    console.log(`\n📊 LEADERBOARD: ${auction.title}`);
    console.log(`💰 Current High Bid: ${auction.currentBid} Pi`);
    console.log("-------------------------------------------");

// Update the log line further down as well:
auction.bids.forEach((bid, index) => {
  const rank = index === 0 ? "👑" : ` #${index + 1}`;
  // 👈 Accessing via bidder_id now
  console.log(`${rank} ${bid.bidder_id} - ${bid.amount} Pi`);
});

  } catch (error) {
    console.error("❌ ERROR FETCHING HISTORY:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check the history for our Test Auction (#1)
getAuctionLeaderboard(3);