import { prisma } from "../../../lib/prisma";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1. Log the body to your terminal to debug
  console.log("Incoming Request Body:", req.body);

  try {
    const { title, description, price, category, sellerId, imageUrls, expiresAt } = req.body;

    // 2. Ensure price is a valid number
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: "Invalid price value received." });
    }

    const auction = await prisma.auctions.create({
      data: {
        title: title,
        description: description || "",
        category: category || "General",
        currentBid: parsedPrice, // This must be a number
        seller_id: sellerId,
        status: "OPEN",
        expires_at: new Date(expiresAt),
        images: {
          create: imageUrls.map((url: string) => ({
            url: url
          }))
        }
      }
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