import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// If the file is in the root, and the client is in src/generated/client:
import { PrismaClient } from './src/generated/client/client';

async function showSummary() {
  // 1. Setup the connection pool (The "non-empty options" Prisma wants)
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const totalVolume = await prisma.escrow_ledger.aggregate({
      _sum: { amount: true }
    });

    const activeItems = await prisma.auctions.findMany({
      where: { status: 'ACTIVE' },
      select: { title: true, current_bid: true }
    });

    console.log("\n--- 🏦 ZAAKA ECONOMY SNAPSHOT ---");
    console.log(`💰 Total Volume in Escrow: ${totalVolume._sum.amount || 0} Pi`);
    console.log(`📦 Currently Active Auctions: ${activeItems.length}`);
    
    activeItems.forEach(item => {
      console.log(`   - ${item.title} (High Bid: ${item.current_bid} Pi)`);
    });
    console.log("----------------------------------\n");

  } catch (error) {
    console.error("❌ Summary Error:", error);
  } finally {
    await pool.end();
  }
}

showSummary();