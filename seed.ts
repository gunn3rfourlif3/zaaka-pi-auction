import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🚀 Starting Force Sync & Seed...");
    
    // Clear data
    await prisma.escrow_ledger.deleteMany();
    await prisma.bids.deleteMany();
    await prisma.auctions.deleteMany();
    await prisma.users.deleteMany();

    // 1. Create Users
    const seller = await prisma.users.create({
      data: { uid: 'u_seller', username: 'Pi_Merchant', kyc_status: true, zaaka_trust_score: 110 }
    });
    const buyer1 = await prisma.users.create({
      data: { uid: 'u_buyer_1', username: 'Pioneer_Alpha', kyc_status: true, zaaka_trust_score: 105 }
    });

    // 2. Create an ACTIVE Auction
    const activeAuction = await prisma.auctions.create({
      data: {
        seller_id: seller.uid,
        title: 'Rare Pi Network Commemorative Coin',
        description: 'Physical coin from 2024 event.',
        start_price: 10.0,
        current_bid: 12.5,
        status: 'ACTIVE',
        end_time: new Date(Date.now() + 86400000)
      }
    });

    // 3. Create a COMPLETED Auction
    const closedAuction = await prisma.auctions.create({
      data: {
        seller_id: seller.uid,
        title: 'Vintage Pi T-Shirt',
        description: 'Sold and delivered.',
        start_price: 5.0,
        current_bid: 15.0,
        status: 'COMPLETED',
        end_time: new Date(Date.now() - 86400000)
      }
    });

// 4. Create Escrow - Schema and Database are now in perfect harmony
    await prisma.escrow_ledger.create({
      data: {
        amount: 15.0,
        payment_status: 'RELEASED', // Recognized by Prisma!
        pi_txid: 'pi_tx_999888777',
        seller_id: seller.uid,
        auctions: {
          connect: { id: closedAuction.id }
        },
        users: {
          connect: { uid: buyer1.uid }
        }
      }
    });

    console.log("✅ SEED COMPLETE: Your Pi Marketplace is ready for business.");

    console.log("✨ SUCCESS: Database is fully seeded and structures are aligned!");
  } catch (e) {
    console.error("❌ SEED FAILED:", e);
  } finally {
    await pool.end();
  }
}

main();