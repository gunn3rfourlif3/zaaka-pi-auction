import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const liveAuctions = await prisma.auctions.findMany({
      where: { status: 'OPEN' },
      orderBy: { created_at: 'desc' },
    });

    // Transform Decimal objects to Numbers to prevent "NaN" in the UI
    const sanitizedAuctions = liveAuctions.map((auction: any) => ({
      ...auction,
      // Prisma Decimals require conversion to String then Number
      currentBid: auction.currentBid ? Number(auction.currentBid.toString()) : 0,
      startingBid: auction.startingBid ? Number(auction.startingBid.toString()) : 0,
    }));

    return res.status(200).json(sanitizedAuctions);
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ error: "DB Error", details: error.message });
  }
}