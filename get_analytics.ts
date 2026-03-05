import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function runGlobalAnalytics() {
  const prisma = new PrismaClient();

  try {
    console.log("📈 --- ZAAKA MARKETPLACE ANALYTICS --- 📈\n");

    // 1. Calculate Total Pi Volume 
    // We filter by 'pi_txid' not being null, assuming that means the trade happened.
    const volumeData = await prisma.escrow_ledger.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        pi_payment_id: { not: null } 
      }
    });

    // 2. Count Auctions by Status
    const auctionStats = await prisma.auctions.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // --- DISPLAY RESULTS ---
    
    console.log(`💰 Total Settled Volume: ${volumeData._sum.amount || 0} Pi`);
    console.log(`🤝 Total Successful Transactions: ${volumeData._count.id}`);
    console.log("-------------------------------------------");

    console.log("📦 Auction Breakdown:");
    auctionStats.forEach(stat => {
      console.log(` - ${stat.status}: ${stat._count.id}`);
    });

  } catch (error: any) {
    console.error(`❌ ANALYTICS ERROR: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

runGlobalAnalytics();