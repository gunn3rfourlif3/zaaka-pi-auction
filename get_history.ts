import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function getAuctionLeaderboard(auctionId: number) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const auction = await prisma.auctions.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' }, // 🏆 Highest bid first
          include: {
            users: { // 👤 Get the username from the 'users' table
              select: { username: true, zaaka_trust_score: true }
            }
          }
        }
      }
    });

    if (!auction) {
      console.log("❌ Auction not found.");
      return;
    }

    console.log(`\n📊 LEADERBOARD: ${auction.title}`);
    console.log(`💰 Current High Bid: ${auction.current_bid} Pi`);
    console.log("-------------------------------------------");

// Update the log line further down as well:
auction.bids.forEach((bid, index) => {
  const rank = index === 0 ? "👑" : ` #${index + 1}`;
  // 👈 Accessing via .users now
  console.log(`${rank} ${bid.users.username} - ${bid.amount} Pi (Trust: ${bid.users.zaaka_trust_score})`);
});

  } catch (error) {
    console.error("❌ ERROR FETCHING HISTORY:", error);
  } finally {
    await pool.end();
  }
}

// Check the history for our Test Auction (#1)
getAuctionLeaderboard(3);