import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { sellerId } = req.query;

  if (!sellerId) {
    return res.status(400).json({ error: "Missing sellerId" });
  }

  try {
    const items = await prisma.auctions.findMany({
      where: {
        // This matches your schema exactly
        seller_id: String(sellerId), 
      },
      select: {
        id: true,
        title: true,
        seller_id: true,
        status: true,
        created_at: true,
        // We EXCLUDE description/current_bid because they aren't in your schema
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json(items);
  } catch (error: any) {
    console.error("❌ PRISMA QUERY ERROR:", error.message);
    return res.status(500).json({ error: "Failed to fetch items", details: error.message });
  }
}