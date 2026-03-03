import { prisma } from "../../../lib/prisma";
import { processAuctionEscrow } from "../../../services/settlement_service";

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, username } = req.body;

  try {
    // 1. Find the auction and its highest bid
    const auction = await prisma.auctions.findUnique({
      where: { id: Number(id) },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        },
        escrow_ledger: true // Include ledger to check existence
      }
    });

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // 2. Security check: Only the winner can confirm receipt
    const winningBid = auction.bids[0];
    if (!winningBid || winningBid.bidder_id !== username) {
      return res.status(403).json({ error: "Unauthorized: Only the winner can confirm receipt." });
    }

    // 3. Ensure Ledger Exists (Auto-settle if missing)
    let ledger = auction.escrow_ledger[0];

    if (!ledger) {
        console.log(`[Receipt] Ledger missing for auction ${id}. Checking if we can auto-settle...`);
        
        // Only settle if auction is actually expired
        if (new Date(auction.expires_at) > new Date()) {
             return res.status(400).json({ error: "Auction is not yet expired. Cannot settle or confirm receipt." });
        }
        
        try {
            console.log(`[Receipt] Triggering auto-settlement for auction ${id}...`);
            await processAuctionEscrow(Number(id), prisma);
            
            // Re-fetch ledger
            const updatedAuction = await prisma.auctions.findUnique({
                where: { id: Number(id) },
                include: { escrow_ledger: true }
            });
            ledger = updatedAuction?.escrow_ledger[0];
            
            if (!ledger) throw new Error("Settlement failed to create ledger record.");
        } catch (settleError: any) {
            console.error("Auto-settlement failed:", settleError);
            return res.status(500).json({ error: "Failed to settle auction before receipt.", details: settleError.message });
        }
    }

    // 4. Update the auction as delivered and the escrow ledger payout status
    // We use a transaction to ensure both happen or neither
    const [updatedAuction] = await prisma.$transaction([
      prisma.auctions.update({
        where: { id: Number(id) },
        data: { delivered: true }
      }),
      prisma.escrow_ledger.update({
        where: { id: ledger.id },
        data: { payout_status: 'RELEASED' }
      })
    ]);

    return res.status(200).json(updatedAuction);
  } catch (error: any) {
    console.error("Receipt confirmation failed:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
