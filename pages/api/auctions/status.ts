import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, sellerId, status } = req.body;

  try {
    // Verify ownership before updating
    const auction = await prisma.auctions.findUnique({
      where: { id: Number(id) }
    });

    if (!auction || auction.seller_id !== sellerId) {
      return res.status(403).json({ error: "Unauthorized: You do not own this auction." });
    }

    const updatedAuction = await prisma.auctions.update({
      where: { id: Number(id) },
      data: { status: status } // Set to 'CANCELLED'
    });

    return res.status(200).json(updatedAuction);
  } catch (error) {
    console.error("Status update failed:", error);
    return res.status(500).json({ error: "Failed to update auction status" });
  }
}