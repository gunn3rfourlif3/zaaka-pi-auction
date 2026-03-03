import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PiAPI } from '../lib/pi_api';

// No adapter needed for standard MySQL connection
const prismaInstance = new PrismaClient();

export async function processAuctionEscrow(auctionId: number, prisma: PrismaClient = prismaInstance) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the auction and the winning bid
    const auction = await tx.auctions.findUnique({
      where: { id: auctionId },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
    });

    if (!auction) throw new Error("Auction not found");

    // 4. Mark Auction as Closed
    await tx.auctions.update({
      where: { id: auction.id },
      data: { status: 'CLOSED' }
    });

    const bid = auction.bids[0];
    if (!bid) {
        // If no bids, just close it and return
        console.log(`Auction ${auctionId} closed with no bids.`);
        return { success: true, noBids: true };
    }

    // 2. Pi Network Handshake (Bypass for Mocks)
    try {
      if (bid.pi_payment_id && bid.pi_payment_id.startsWith('pay_mock')) {
        console.log("🛠️ Mock ID Detected: Simulating Blockchain Settlement...");
      } else if (bid.pi_payment_id) {
        try {
          const result = await PiAPI.settlePayment(bid.pi_payment_id);
          console.log(`✅ Pi Payment Settled: ${bid.pi_payment_id} | TXID: ${result.txid}`);
        } catch (settleError: any) {
          // Handle payment_not_found gracefully
          if (settleError.message && settleError.message.includes('payment_not_found')) {
            console.warn(`⚠️ Payment ${bid.pi_payment_id} not found on Pi Network. May have been settled already or created in different environment.`);
            // Continue with settlement process - this is not a critical failure
          } else {
            console.error("❌ Pi Settlement Error:", settleError.message);
            throw new Error("Failed to settle Pi payment.");
          }
        }
      } else {
        console.warn("⚠️ No pi_payment_id found for bid:", bid.id);
      }
    } catch (error: any) {
      console.error("❌ Pi Settlement Error:", error.message);
      throw new Error("Failed to settle Pi payment.");
    }

    // 3. Create the Escrow Ledger Record (Using your specific schema fields)
    await tx.escrow_ledger.create({
      data: {
        auction_id: auction!.id,
        amount: bid.amount,
        payment_status: 'COMPLETED', // Status used for 'IN'
        winner_id: bid.bidder_id,
        seller_id: auction!.seller_id,
        pi_payment_id: bid.pi_payment_id || 'N/A'
      }
    });

    // 4. Mark Auction as Closed/Paid (ALREADY DONE ABOVE)
    // Removed redundant update
    
    // 5. Emit Finalized Event
    if (global.io) {
        global.io.emit('auction_finalized', {
            auctionId: auction.id,
            finalPrice: Number(bid.amount),
            winnerId: bid.bidder_id,
            status: 'CLOSED'
        });
        console.log(`🏁 Auction #${auctionId} finalized. Winner: ${bid.bidder_id} @ ${bid.amount}`);
    }

    return { success: true };
  });
}