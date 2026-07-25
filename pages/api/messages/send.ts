import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Must be signed in; the sender identity is taken from the session, not the body.
  const session = requireAuth(req, res);
  if (!session) return;

  const { receiverId, auctionId, content } = req.body;

  if (!receiverId || !auctionId || !content || typeof content !== "string") {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 characters)." });
  }

  try {
    const message = await prisma.messages.create({
      data: {
        sender_id: session.username,
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
