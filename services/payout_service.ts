import { prisma } from '../lib/prisma';
import { PiAPI } from '../lib/pi_api';

/**
 * ZAAKA PAYOUT LOGIC
 * Handles the transfer of funds from Escrow to Seller after Buyer confirms receipt.
 */
export async function confirmDeliveryAndPayout(auctionId: number, buyerId: string) {
  try {
    // 1. Start a transaction with an extended timeout (30s)
    // This prevents "Pool Timeouts" while waiting for the Pi Blockchain response.
    return await prisma.$transaction(async (tx) => {
      
      // 2. Fetch the Escrow entry
      // We use 'escrow_ledger' and include 'auctions' (plural) to match your schema
      const escrowEntry = await tx.escrow_ledger.findFirst({
        where: {
          auction_id: auctionId,
          payment_status: 'COMPLETED',
          // Note: If 'db pull' named this 'winner_id', use that instead of 'buyer_id'
        },
        include: { 
          auctions: true 
        }
      });

      if (!escrowEntry) {
        throw new Error(`No completed escrow record found for Auction ID: ${auctionId}`);
      }

      // 3. Execute Blockchain Payout to Seller
      // We pull the seller_id and the amount directly from the database record
      console.log(`🚀 Initiating Pi Payout for Auction ${auctionId} to Seller ${escrowEntry.auctions.seller_id}`);
      
      const payout = await PiAPI.submitPayout(
        escrowEntry.auctions.seller_id,
        Number(escrowEntry.amount)
      );

      // 4. Update Auction status to SETTLED
      // This tells the UI the transaction is officially finished
      await tx.auctions.update({
        where: { id: auctionId },
        data: { status: 'SETTLED_TO_SELLER' }
      });

      console.log(`✅ Payout Successful. TXID: ${payout.txid}`);
      
      return { 
        success: true, 
        txid: payout.txid 
      };

    }, {
      maxWait: 10000, // Wait up to 10s to get a connection
      timeout: 30000  // Total time allowed for the transaction + Pi API call
    });

  } catch (error: any) {
    console.error("❌ PAYOUT SERVICE ERROR:", error.message);
    // Re-throw the error so the API route can return a 500 status
    throw error;
  }
}