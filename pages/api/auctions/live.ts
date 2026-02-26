import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  try {
    const auctions = await prisma.auctions.findMany({
      include: {
        images: true,
        bids: {
          select: {
            bidder_id: true,
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

    // Filter manually if Prisma Client is out of sync
    const filtered = (auctions as any[]).filter(a => 
      a.status === "OPEN" || (a.status === "CLOSED" && a.delivered === false)
    );

    return res.status(200).json(filtered);
  } catch (error: any) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch auctions" });
  }
}