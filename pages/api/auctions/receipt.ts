import { prisma } from "../../../lib/prisma";

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
        }
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

    // 3. Update the auction as delivered and the escrow ledger payout status
    const [updatedAuction] = await prisma.$transaction([
      prisma.auctions.update({
        where: { id: Number(id) },
        data: { delivered: true }
      }),
      prisma.escrow_ledger.updateMany({
        where: { auction_id: Number(id) },
        data: { payout_status: 'RELEASED' }
      })
    ]);

    return res.status(200).json(updatedAuction);
  } catch (error) {
    console.error("Receipt confirmation failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
