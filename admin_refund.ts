import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

/**
 * Admin function to refund a buyer.
 * This should only be accessible by marketplace moderators.
 */
async function adminRefund(escrowId: number, adminReason: string) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`⚖️  ADMIN ACTION: Initiating refund for Escrow ID: ${escrowId}...`);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the escrow record
      const escrow = await tx.escrow_ledger.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) throw new Error("Escrow record not found.");

      // 2. SAFETY CHECK: Can only refund if funds are still HELD or DISPUTED
      if (escrow.payment_status === 'RELEASED') {
        throw new Error("Cannot refund: Funds have already been released to the seller.");
      }
      if (escrow.payment_status === 'REFUNDED') {
        throw new Error("This transaction has already been refunded.");
      }

      // 3. Perform the Refund
      const updatedEscrow = await tx.escrow_ledger.update({
        where: { id: escrowId },
        data: { 
          payment_status: 'REFUNDED',
          // We can log the reason in a notes field if you add one, 
          // for now, we'll just log to console.
        }
      });

      // 4. Update the Auction status to reflect the failure
      await tx.auctions.update({
        where: { id: escrow.auction_id },
        data: { status: 'REFUNDED_BY_ADMIN' }
      });

      return updatedEscrow;
    });

    console.log(`✅ REFUND COMPLETE: ${result.amount} Pi returned to User ${result.winner_id}.`);
    console.log(`📝 Reason: ${adminReason}`);

  } catch (error: any) {
    console.error(`❌ REFUND FAILED: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// --- TEST: Refund the transaction created in the previous step ---
// Usage: adminRefund(escrow_id, "reason_for_refund")
adminRefund(1, "Seller failed to provide tracking information within 72 hours.");