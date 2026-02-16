import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const liveAuctions = await prisma.auctions.findMany({
      where: {
        status: 'OPEN',
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return res.status(200).json(liveAuctions);
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch live auctions" });
  }
}