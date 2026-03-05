import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function auditUserTrust(userId: string) {
  const prisma = new PrismaClient();

  try {
    // Note: users model not available in current schema
    console.log(`🔍 Auditing user: ${userId}`);
    
    // Get auctions where user is seller
    const sellerAuctions = await prisma.auctions.findMany({
      where: { seller_id: userId }
    });
    
    console.log(`📊 User ${userId} has listed ${sellerAuctions.length} auctions`);
    
    // Get auctions where user is winner
    const winnerAuctions = await prisma.escrow_ledger.findMany({
      where: { winner_id: userId }
    });
    
    console.log(`🏆 User ${userId} has won ${winnerAuctions.length} auctions`);

    // Get successful trades (with payment)
    const successfulTrades = await prisma.escrow_ledger.findMany({
      where: { 
        winner_id: userId,
        pi_payment_id: { not: null }
      }
    });

    console.log(`✅ User ${userId} has ${successfulTrades.length} successful trades`);

  } catch (error) {
    console.error("❌ User Audit Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check the audit for our Test User
auditUserTrust("@arsenal");