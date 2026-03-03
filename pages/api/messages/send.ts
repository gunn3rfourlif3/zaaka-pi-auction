import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { senderId, receiverId, auctionId, content } = req.body;

  if (!senderId || !receiverId || !auctionId || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = await prisma.messages.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        auction_id: Number(auctionId),
        content: content,
        read: false
      }
    });

    return res.status(200).json(message);
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
