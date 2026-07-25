import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Only authenticated Pi users may create auctions.
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const { title, description, price, category, imageUrls, expiresAt } = req.body;

    // --- Validation ---
    if (!title || typeof title !== "string" || title.trim().length < 3 || title.length > 255) {
      return res.status(400).json({ error: "Title must be between 3 and 255 characters." });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "Invalid price value received." });
    }
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      return res.status(400).json({ error: "Expiry must be a valid future date." });
    }
    const images: string[] = Array.isArray(imageUrls)
      ? imageUrls.filter((u) => typeof u === "string")
      : [];

    const auction = await prisma.auctions.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description : "",
        category: category || "General",
        currentBid: parsedPrice,
        // Seller identity comes from the verified session, never the request body.
        seller_id: session.username,
        status: "OPEN",
        expires_at: expiry,
        images: {
          create: images.map((url: string) => ({ url })),
        },
      },
    });

    return res.status(200).json(auction);
  } catch (error: any) {
    console.error("PRISMA_CREATE_ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
