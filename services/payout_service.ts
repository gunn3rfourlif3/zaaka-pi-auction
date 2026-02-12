import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
//import { PrismaClient } from '../src/generated/client/client';
import { PiAPI } from '../lib/pi_api';



const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * ZAAKA PAYOUT LOGIC
 * Releases Pi from the platform Escrow to the Seller's wallet.
 */
export async function confirmDeliveryAndPayout(auctionId: number, buyerId: string, prisma: PrismaClient) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch the Escrow entry using your specific schema fields
      const escrowEntry = await tx.escrow_ledger.findFirst({
        where: {
          auction_id: auctionId,
          payment_status: 'COMPLETED',
          winner_id: buyerId
        },
        include: { auctions: true }
      });

      if (!escrowEntry) {
        throw new Error("No escrow record found for this auction.");
      }

      // 2. Blockchain Payout to Seller
      const payout = await PiAPI.submitPayout(
        escrowEntry.auctions.seller_id,
        Number(escrowEntry.amount)
      );

      // 3. Update Auction status to final state
      await tx.auctions.update({
        where: { id: auctionId },
        data: { status: 'SETTLED_TO_SELLER' }
      });

      console.log(`💰 Payout Released: ${escrowEntry.amount} Pi to Seller ${escrowEntry.auctions.seller_id}`);
      return { success: true, txid: payout.txid };
    });
  } catch (error: any) {
    console.error("❌ PAYOUT ERROR:", error.message);
    throw error;
  }
}