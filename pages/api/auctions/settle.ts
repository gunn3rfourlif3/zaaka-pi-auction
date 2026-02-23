import { prisma } from "../../../lib/prisma";
import { processAuctionEscrow } from "../../../services/settlement_service";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { auctionId } = req.body;

  try {
    // 🟢 We use your existing service which handles:
    // 1. Finding the winner
    // 2. Settling the Pi Payment on the blockchain
    // 3. Creating the Escrow Ledger record
    // 4. Marking the auction as CLOSED
    const result = await processAuctionEscrow(Number(auctionId), prisma);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Settlement Error:", error.message);
    res.status(500).json({ error: error.message || "Settlement failed" });
  }
}