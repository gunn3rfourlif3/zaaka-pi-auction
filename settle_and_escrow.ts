import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';
// Imagine PiAPI is your Pi SDK v26 wrapper for server-side calls
import { PiAPI } from './lib/pi_api'; 


async function processAuctionEscrow(auctionId: number) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get auction and winning bid
      const auction = await tx.auctions.findUnique({
        where: { id: auctionId },
        include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
      });

      // Updated to match your worker's COMPLETED status
if (!auction || (auction.status !== 'ACTIVE' && auction.status !== 'COMPLETED')) {
    throw new Error(`Invalid auction state: ${auction?.status}. Settlement requires ACTIVE or COMPLETED.`);
}
      
      const winner = auction.bids[0];
      if (!winner) {
          await tx.auctions.update({ where: { id: auctionId }, data: { status: 'CLOSED_NO_BIDS' } });
          return "No bids found. Auction closed.";
      }

      // 2. BLOCKCHAIN HANDSHAKE: Finalize the Pi Payment
      // Every bid has a pi_payment_id in your schema. We must SETTLE it.
      const blockchainSettlement = await PiAPI.settlePayment(winner.pi_payment_id);
      
      if (blockchainSettlement.status !== 'SETTLED') {
          throw new Error("Blockchain settlement failed. Funds not moved.");
      }

      // 3. Update Auction to CLOSED
      await tx.auctions.update({
        where: { id: auctionId },
        data: { status: 'CLOSED' }
      });

      // 4. Create Escrow Ledger Entry (Direction: IN)
      const escrow = await tx.escrow_ledger.create({
        data: {
          pi_txid: blockchainSettlement.txid, // Native Stellar/Pi TxID
          amount: winner.amount,
          direction: "IN", // Matches your schema blueprint
          timestamp: new Date(),
          // Connect to auction and winner
          auctions: { connect: { id: auctionId } },
          users: { connect: { uid: winner.bidder_id } }
        }
      });

      return { winner: winner.bidder_id, amount: winner.amount, txid: blockchainSettlement.txid };
    });

    console.log(`🏆 Winner: ${result.winner} | Amount: ${result.amount} Pi`);
    console.log(`🔒 Escrow Settled on Chain (Tx: ${result.txid}).`);

  } catch (error: any) {
    console.error(`❌ SETTLEMENT ERROR: ${error.message}`);
  } finally {
    await pool.end();
  }
}

processAuctionEscrow(2);