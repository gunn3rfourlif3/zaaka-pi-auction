import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function settleExpiredAuctions() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🔍 Checking for expired auctions...");

    // 1. Find all ACTIVE auctions where end_time has passed
    const expired = await prisma.auctions.findMany({
      where: {
        status: 'ACTIVE',
        end_time: { lt: new Date() } // "Less Than" now
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1 // Get only the highest bid
        }
      }
    });

    if (expired.length === 0) {
      console.log("✨ No auctions to settle at this time.");
      return;
    }

    for (const auction of expired) {
      const winner = auction.bids[0];

      await prisma.$transaction(async (tx) => {
        // 2. Mark auction as CLOSED
        await tx.auctions.update({
          where: { id: auction.id },
          data: { status: 'CLOSED' }
        });

        if (winner) {
          console.log(`🏆 Auction #${auction.id} (${auction.title}) won by ${winner.bidder_id} for ${winner.amount} Pi!`);
          // Here is where you'd trigger the Pi SDK Payment notification
        } else {
          console.log(`❌ Auction #${auction.id} ended with no bids.`);
        }
      });
    }

  } catch (error) {
    console.error("❌ Settlement Error:", error);
  } finally {
    await pool.end();
  }
}

settleExpiredAuctions();