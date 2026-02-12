import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
//import { PrismaClient } from './src/generated/client/client';
import { PrismaClient } from '@prisma/client';
import { processAuctionEscrow } from './services/settlement_service';
import { confirmDeliveryAndPayout } from './services/payout_service';

// 1. Setup the Database Adapter (Required for your XAMPP/Postgres setup)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ... (Your existing imports and adapter setup)

async function runMockTest() {
  console.log("📡 Connecting to Database...");
  try {
    // Step 0: User Setup
    console.log("👤 Step 0: Ensuring Mock Users exist in DB...");
    await prisma.users.upsert({
      where: { uid: "seller_pioneer_999" },
      update: {},
      create: { uid: "seller_pioneer_999", username: "TestSeller", zaaka_trust_score: 100 }
    });
    await prisma.users.upsert({
      where: { uid: "buyer_pioneer_111" },
      update: {},
      create: { uid: "buyer_pioneer_111", username: "TestBuyer", zaaka_trust_score: 100 }
    });

    // Step 1: Create Auction
    console.log("🏗️ Step 1: Creating Mock Auction...");
    const auction = await prisma.auctions.create({
      data: {
        title: "Test Pi Watch",
        description: "Protocol testing",
        status: "ACTIVE",
        seller_id: "seller_pioneer_999",
        end_time: new Date(Date.now() - 10000), 
        start_price: 10.0,
        bids: {
          create: {
            amount: 25.0,
            bidder_id: "buyer_pioneer_111",
            pi_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
            status: "APPROVED"
          }
        }
      }
    });
    console.log(`✅ Auction Created (ID: ${auction.id}).`);

    // Step 2: Settlement
    console.log("🔄 Step 2: Running Auto-Settlement Logic...");
    await processAuctionEscrow(auction.id, prisma);
    console.log("✅ Settlement Ledger entry created.");

    // Step 3: Payout
    console.log("🔄 Step 3: Running Buyer Confirmation & Payout...");
    const result = await confirmDeliveryAndPayout(auction.id, "buyer_pioneer_111", prisma);

    if (result.success) {
        console.log(`✅ Payout Successful! TXID: ${result.txid}`);
        console.log("🏁🏁🏁 FULL LOOP TEST PASSED 🏁🏁🏁");
    }

  } catch (error: any) {
    console.error("❌ TEST FAILED:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log("🔌 Database connections closed.");
  }
}

// CRITICAL: This line must exist to actually run the code!
runMockTest();