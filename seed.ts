import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient();

  try {
    console.log("🚀 Starting Force Sync & Seed...");
    
    // Clear data
    await prisma.escrow_ledger.deleteMany();
    await prisma.bids.deleteMany();
    await prisma.auctions.deleteMany();
    // Note: No users table in current schema

    // 1. Create Users (Note: No users table in current schema)
    // Using hardcoded user IDs for auction creation
    const sellerId = 'u_seller';
    const buyer1Id = 'u_buyer_1';

    // 2. Create an ACTIVE Auction
    const activeAuction = await prisma.auctions.create({
      data: {
        seller_id: sellerId,
        title: 'Rare Pi Network Commemorative Coin',
        description: 'Physical coin from 2024 event.',
        currentBid: 12.5,
        status: 'ACTIVE',
        expires_at: new Date(Date.now() + 86400000)
      }
    });

    // 3. Create a COMPLETED Auction
    const closedAuction = await prisma.auctions.create({
      data: {
        seller_id: sellerId,
        title: 'Vintage Pi T-Shirt',
        description: 'Sold and delivered.',
        currentBid: 15.0,
        status: 'COMPLETED',
        expires_at: new Date(Date.now() - 86400000)
      }
    });

// 4. Create Escrow - Schema and Database are now in perfect harmony
    await prisma.escrow_ledger.create({
      data: {
        amount: 15.0,
        payment_status: 'RELEASED', // Recognized by Prisma!
        pi_payment_id: 'pi_tx_999888777',
        seller_id: sellerId,
        winner_id: buyer1Id,
        auctions: {
          connect: { id: closedAuction.id }
        },
        // Note: No users table in current schema
      }
    });

    console.log("✅ SEED COMPLETE: Your Pi Marketplace is ready for business.");

    console.log("✨ SUCCESS: Database is fully seeded and structures are aligned!");
  } catch (e) {
    console.error("❌ SEED FAILED:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();