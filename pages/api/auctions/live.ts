import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  try {
    const auctions = await prisma.auctions.findMany({
      where: {
        status: "OPEN",
      },
      include: {
        images: true,
        // 🟢 This is the magic part that adds the "Number of Bids"
        _count: {
          select: { bids: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json(auctions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
}