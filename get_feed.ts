
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function getLiveFeed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🏪 Fetching Zaaka Live Marketplace Feed...\n");

    const auctions = await prisma.auctions.findMany({
      where: {
        status: 'ACTIVE',
        end_time: { gt: new Date() } // Only show auctions that haven't expired
      },
      orderBy: {
        end_time: 'asc' // ⏱️ Soonest to expire at the top (Urgency!)
      },
      include: {
        users: { // Get the seller's details
          select: { username: true, zaaka_trust_score: true }
        },
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
      const timeLeft = Math.max(0, (item.end_time.getTime() - Date.now()) / (1000 * 60 * 60));
      
      console.log(`📦 ITEM: ${item.title}`);
      console.log(`👤 Seller: ${item.users.username} (Trust: ${item.users.zaaka_trust_score})`);
      console.log(`💰 Current Bid: ${item.current_bid} Pi`);
      console.log(`📈 Activity: ${item._count.bids} bids placed`);
      console.log(`⏳ Ending in: ${timeLeft.toFixed(1)} hours`);
      console.log("-------------------------------------------");
    });

  } catch (error) {
    console.error("❌ FEED ERROR:", error);
  } finally {
    await pool.end();
  }
}

getLiveFeed();