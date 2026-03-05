
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function getLiveFeed() {
  const prisma = new PrismaClient();

  try {
    console.log("🏪 Fetching Zaaka Live Marketplace Feed...\n");

    const auctions = await prisma.auctions.findMany({
      where: {
        status: 'ACTIVE',
        expires_at: { gt: new Date() } // Only show auctions that haven't expired
      },
      orderBy: {
        expires_at: 'asc' // ⏱️ Soonest to expire at the top (Urgency!)
      },
      include: {
        // users: { // Get the seller's details - users model not available
        //   select: { username: true, zaaka_trust_score: true }
        // },
        _count: {
          select: { bids: true } // Count how many bids have been placed
        }
      }
    });

    if (auctions.length === 0) {
      console.log("📭 The marketplace is empty right now.");
      return;
    }

    auctions.forEach((item) => {
      const timeLeft = Math.max(0, (item.expires_at.getTime() - Date.now()) / (1000 * 60 * 60));
      
      console.log(`📦 ITEM: ${item.title}`);
      console.log(`👤 Seller: ${item.seller_id}`);
      console.log(`💰 Current Bid: ${item.currentBid} Pi`);
      console.log(`📈 Activity: ${item._count.bids} bids placed`);
      console.log(`⏳ Ending in: ${timeLeft.toFixed(1)} hours`);
      console.log("-------------------------------------------");
    });

  } catch (error) {
    console.error("❌ FEED ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getLiveFeed();