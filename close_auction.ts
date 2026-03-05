import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function settleExpiredAuctions() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking for expired auctions...");

    // 1. Find all ACTIVE auctions where end_time has passed
    const expired = await prisma.auctions.findMany({
      where: {
        status: 'ACTIVE',
        expires_at: { lt: new Date() } // "Less Than" now
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
    await prisma.$disconnect();
  }
}

settleExpiredAuctions();