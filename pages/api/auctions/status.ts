import { prisma } from "../../../lib/prisma";
import { processAuctionEscrow } from "../../../services/settlement_service";

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, sellerId, status } = req.body;

  try {
    // 1. Verify existence and ownership
    const auction = await prisma.auctions.findUnique({
      where: { id: Number(id) }
    });

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // Only verify ownership for manual actions like 'CANCELLED'
    // 'CLOSED' (settlement) is triggered by the system/timer
    if (status === 'CANCELLED' && auction.seller_id !== sellerId) {
      return res.status(403).json({ error: "Unauthorized: You do not own this auction." });
    }

    // 2. Handle 'CLOSED' vs 'CANCELLED'
    if (status === 'CLOSED') {
      // If it's already closed, don't re-settle
      if (auction.status === 'CLOSED') return res.status(200).json(auction);

      // Trigger full settlement logic (financials + status update)
      const result = await processAuctionEscrow(Number(id), prisma);
      return res.status(200).json({ success: true, ...result });
    }

    // 3. Simple status update for other states (like CANCELLED)
    const updatedAuction = await prisma.auctions.update({
      where: { id: Number(id) },
      data: { status: status }
    });

    return res.status(200).json(updatedAuction);
  } catch (error) {
    console.error("Status update failed:", error);
    return res.status(500).json({ error: "Failed to update auction status" });
  }
}