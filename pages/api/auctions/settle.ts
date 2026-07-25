import { prisma } from "../../../lib/prisma";
import { processAuctionEscrow } from "../../../services/settlement_service";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  // Manual settlement is a privileged, money-moving action — admin only.
  // (Routine settlement happens automatically via the protected cron endpoint.)
  const session = requireAdmin(req, res);
  if (!session) return;

  const { auctionId } = req.body;
  if (!auctionId || isNaN(Number(auctionId))) {
    return res.status(400).json({ error: "Valid auctionId is required" });
  }

  try {
    const result = await processAuctionEscrow(Number(auctionId), prisma);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Settlement Error:", error.message);
    res.status(500).json({ error: error.message || "Settlement failed" });
  }
}
