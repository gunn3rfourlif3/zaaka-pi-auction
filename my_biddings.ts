import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function getMyBiddingDashboard(userId: string) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient();

  try {
    console.log(`👤 Fetching Bidding Dashboard for: ${userId}...\n`);

    // Find all auctions where this user has at least one bid
    const auctions = await prisma.auctions.findMany({
      where: {
        bids: {
          some: { bidder_id: userId }
        }
      },
      include: {
        bids: {
          where: { bidder_id: userId },
          orderBy: { amount: 'desc' },
          take: 1 // Get the user's personal highest bid for this auction
        }
      }
    });

    if (auctions.length === 0) {
      console.log("📭 You haven't placed any bids yet.");
      return;
    }

    console.log("ID  | Status   | My High Bid | Current Price | Result");
    console.log("----------------------------------------------------------");

    auctions.forEach((auction) => {
      const myMaxBid = Number(auction.bids[0].amount);
      const currentPrice = Number(auction.currentBid);
      
      let statusIcon = "";
      let resultText = "";

      if (auction.status === 'ACTIVE') {
        if (myMaxBid >= currentPrice) {
          statusIcon = "🟢";
          resultText = "WINNING";
        } else {
          statusIcon = "🔴";
          resultText = "OUTBID";
        }
      } else {
        // Auction is CLOSED
        if (myMaxBid >= currentPrice) {
          statusIcon = "🏆";
          resultText = "WON";
        } else {
          statusIcon = "⚪";
          resultText = "LOST";
        }
      }

      console.log(
        `${auction.id.toString().padEnd(3)} | ` +
        `${auction.status.padEnd(8)} | ` +
        `${myMaxBid.toString().padEnd(11)} | ` +
        `${currentPrice.toString().padEnd(13)} | ` +
        `${statusIcon} ${resultText}`
      );
    });

  } catch (error) {
    console.error("❌ DASHBOARD ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// TEST: Check the dashboard for Pioneer_Alpha (user_67890_bidder)
getMyBiddingDashboard('user_67890_bidder');