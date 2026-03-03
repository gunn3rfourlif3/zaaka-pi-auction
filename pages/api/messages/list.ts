import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auctionId, userId } = req.query;

  if (!auctionId || !userId) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  try {
    const messages = await prisma.messages.findMany({
      where: {
        auction_id: Number(auctionId),
        OR: [
          { sender_id: String(userId) },
          { receiver_id: String(userId) }
        ]
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return res.status(200).json(messages);
  } catch (error: any) {
    console.error("Failed to fetch messages:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
