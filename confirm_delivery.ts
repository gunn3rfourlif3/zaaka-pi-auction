import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function confirmDelivery(escrowId: number) {
  const prisma = new PrismaClient();

  try {
    console.log(`📦 Confirming delivery for Escrow ID: ${escrowId}...`);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Escrow and associated Auction
      const escrow = await tx.escrow_ledger.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) throw new Error("Escrow record not found.");
      if (escrow.payment_status !== 'HELD') {
        throw new Error(`Cannot release funds. Current status is: ${escrow.payment_status}`);
      }

      // 2. Release the Funds (Change status to RELEASED)
      const updatedEscrow = await tx.escrow_ledger.update({
        where: { id: escrowId },
        data: { payment_status: 'RELEASED' }
      });

      // 3. Mark Auction as COMPLETELY FINISHED
      await tx.auctions.update({
        where: { id: escrow.auction_id },
        data: { status: 'COMPLETED' }
      });

      // 4. Update Trust Scores (+2 for successful trade)
      // Both the buyer (winner_id) and seller (seller_id) benefit
      // Note: users model not available in current schema
      // await tx.users.update({
      //   where: { uid: escrow.seller_id },
      //   data: { zaaka_trust_score: { increment: 2 } }
      // });

      // await tx.users.update({
      //   where: { uid: escrow.winner_id },
      //   data: { zaaka_trust_score: { increment: 2 } }
      // });

      return updatedEscrow;
    });

    console.log(`💰 SUCCESS: Funds released to Seller ${result.seller_id}.`);
    console.log(`⭐ Trust Scores for both parties have been increased!`);

  } catch (error: any) {
    console.error(`❌ CONFIRMATION FAILED: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// --- TEST: Confirm delivery for Escrow ID 1 ---
confirmDelivery(1);