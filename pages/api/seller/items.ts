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
      },
      include: {
        images: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        },
        _count: {
          select: { bids: true } 
        }
      },
    });

    // Filter manually if Prisma Client is out of sync
    const filtered = (items as any[]).filter(a => 
      a.status === "OPEN" || (a.status === "CLOSED" && a.delivered === false)
    );

    return res.status(200).json(filtered);
  } catch (error: any) {
    console.error("❌ PRISMA QUERY ERROR:", error.message);
    return res.status(500).json({ error: "Failed to fetch items", details: error.message });
  }
}