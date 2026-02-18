import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { sellerId } = req.query;

  if (!sellerId) {
    return res.status(400).json({ error: "Missing sellerId" });
  }

  try {
    const items = await prisma.auctions.findMany({
      where: {
        seller_id: String(sellerId), 
        status: "OPEN" // 🟢 Add this to hide cancelled/closed items
      },
      // Instead of 'select', we use 'include' for the relationship
      // and let Prisma return all other top-level fields automatically
      include: {
    images: true,
    // 🟢 ADD THIS BLOCK HERE:
    _count: {
      select: { bids: true } 
    }
  },
    });

    return res.status(200).json(items);
  } catch (error: any) {
    console.error("❌ PRISMA QUERY ERROR:", error.message);
    return res.status(500).json({ error: "Failed to fetch items", details: error.message });
  }
}