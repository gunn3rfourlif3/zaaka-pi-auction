import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  try {
    const auctions = await prisma.auctions.findMany({
      where: {
        status: "OPEN",
      },
      include: {
        images: true,
        bids: {
          select: {
            bidder_id: true, // 🟢 FIXED: Match schema (underscore)
          }
        },
        _count: {
          select: { bids: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json(auctions);
  } catch (error: any) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch auctions" });
  }
}