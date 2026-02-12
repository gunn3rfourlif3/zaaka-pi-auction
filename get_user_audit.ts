import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function auditUserTrust(userId: string) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.users.findUnique({
      where: { uid: userId },
      include: {
        // Find all escrow transactions where this user was the seller
        _count: {
          select: { auctions: true } // Total items listed
        }
      }
    });

    if (!user) throw new Error("User not found.");

// 1. Fetch successful trades (Mapping to your actual 'user_id' and 'auctions' fields)
const successfulTrades = await prisma.escrow_ledger.findMany({
  where: { 
    user_id: userId, // 👈 Changed from seller_id
    pi_txid: { not: null } // 👈 Since 'payment_status' might be missing, we check for a TXID
  },
  include: { 
    auctions: { // 👈 Changed from 'auction' to 'auctions' based on error suggestions
      select: { title: true } 
    } 
  }
});

// 2. Fetch failed trades (Assuming for now that no pi_txid + direction logic implies failure)
const failedTrades = await prisma.escrow_ledger.findMany({
  where: { 
    user_id: userId, 
    pi_txid: null,
    direction: 'REFUND' // 👈 Using your 'direction' field as a proxy for status
  },
  include: { 
    auctions: { 
      select: { title: true } 
    } 
  }
});

    console.log(`\n🕵️  TRUST AUDIT FOR: ${user.username} (${userId})`);
    console.log(`⭐ Current Trust Score: ${user.zaaka_trust_score}`);
    console.log(`✅ KYC Status: ${user.kyc_status ? 'VERIFIED' : 'UNVERIFIED'}`);
    console.log("--------------------------------------------------");

    console.log(`\n📈 POSITIVE IMPACTS (+2 per trade):`);
    if (successfulTrades.length === 0) console.log(" - No successful trades yet.");
    successfulTrades.forEach(t => {
      console.log(` [+] Successfully delivered: "${t.auction.title}"`);
    });

    console.log(`\n📉 NEGATIVE IMPACTS (-10 per refund):`);
    if (failedTrades.length === 0) console.log(" - Clean record! No failed trades.");
    failedTrades.forEach(t => {
      console.log(` [-] Refunded/Disputed: "${t.auction.title}"`);
    });

    // Calculate a "Projected Score" logic
    const calculatedScore = 100 + (successfulTrades.length * 2) - (failedTrades.length * 10);
    console.log(`\n🧮 LOGIC CHECK: 100 (Base) + ${successfulTrades.length * 2} (Success) - ${failedTrades.length * 10} (Failures) = ${calculatedScore}`);

  } catch (error: any) {
    console.error(`❌ AUDIT FAILED: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// TEST: Audit the main seller
auditUserTrust('user_12345_seller');