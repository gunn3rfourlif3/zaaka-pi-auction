import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function showSummary() {
  const prisma = new PrismaClient();

  try {
    const totalVolume = await prisma.escrow_ledger.aggregate({
      _sum: { amount: true }
    });

    const activeItems = await prisma.auctions.findMany({
      where: { status: 'ACTIVE' },
      select: { title: true, currentBid: true }
    });

    console.log("\n--- 🏦 ZAAKA ECONOMY SNAPSHOT ---");
    console.log(`💰 Total Volume in Escrow: ${totalVolume._sum.amount || 0} Pi`);
    console.log(`📦 Currently Active Auctions: ${activeItems.length}`);
    
    activeItems.forEach(item => {
      console.log(`   - ${item.title} (High Bid: ${item.currentBid} Pi)`);
    });
    console.log("----------------------------------\n");

  } catch (error) {
    console.error("❌ Summary Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

showSummary();