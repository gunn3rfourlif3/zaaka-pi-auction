import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { title, description, startPrice, sellerId, imageUrls, expiresAt } = req.body;

  try {
    const newAuction = await prisma.auctions.create({
      data: {
        title,
        description,
        currentBid: parseFloat(startPrice),
        seller_id: sellerId,
        status: "OPEN",
        expires_at: new Date(expiresAt), // Save the date
        images: {
          create: imageUrls.map((url: string) => ({ url }))
        }
      }
    });
    res.status(200).json(newAuction);
  } catch (error) {
    res.status(500).json({ error: "Failed to create auction" });
  }
}