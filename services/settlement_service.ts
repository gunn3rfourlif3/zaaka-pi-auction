import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PiAPI } from '../lib/pi_api';


const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter })

// Use the adapter-safe initialization we established
export async function processAuctionEscrow(auctionId: number, prisma: PrismaClient) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the auction and the winning bid
    const auction = await tx.auctions.findUnique({
      where: { id: auctionId },
      include: { bids: { where: { status: 'APPROVED' }, orderBy: { amount: 'desc' }, take: 1 } }
    });

    const bid = auction?.bids[0];
    if (!bid) throw new Error("No winning bid found.");

    // 2. Pi Network Handshake (Bypass for Mocks)
    try {
      if (bid.pi_payment_id.startsWith('pay_mock')) {
        console.log("🛠️ Mock ID Detected: Simulating Blockchain Settlement...");
      } else {
        await PiAPI.settlePayment(bid.pi_payment_id);
      }
    } catch (error: any) {
      console.error("❌ Pi Settlement Error:", error.message);
      throw new Error("Failed to settle Pi payment.");
    }

    // 3. Create the Escrow Ledger Record (Using your specific schema fields)
    await tx.escrow_ledger.create({
      data: {
        auction_id: auction.id,
        amount: bid.amount,
        payment_status: 'COMPLETED', // Status used for 'IN'
        winner_id: bid.bidder_id,
        seller_id: auction.seller_id,
        pi_txid: bid.pi_payment_id
      }
    });

    // 4. Mark Auction as Closed/Paid
    await tx.auctions.update({
      where: { id: auction.id },
      data: { status: 'CLOSED' }
    });

    return { success: true };
  });
}