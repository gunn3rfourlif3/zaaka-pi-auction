import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  try {
    const item = await prisma.auctions.findUnique({
      where: { id: Number(id) },
      include: {
        images: true,
        bids: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        _count: {
          select: { bids: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: "Auction not found" });
    }
    
    return res.status(200).json(item);
  } catch (e) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}