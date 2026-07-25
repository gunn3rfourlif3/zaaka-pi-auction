import { prisma } from "../../../lib/prisma";
import { processAuctionEscrow } from "../../../services/settlement_service";

export default async function handler(req: any, res: any) {
  // Require a shared secret so only the scheduler (cron / systemd timer) can
  // trigger settlement. Configure CRON_SECRET and send it as a Bearer token.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Find all auctions that passed their expiry but are still OPEN
    const expiredAuctions = await prisma.auctions.findMany({
      where: {
        expires_at: { lt: new Date() },
        status: 'OPEN'
      }
    });

    // 2. Process them through your settlement service
    const results = await Promise.allSettled(
      expiredAuctions.map(auction => processAuctionEscrow(auction.id, prisma))
    );

    res.status(200).json({ 
      processed: expiredAuctions.length,
      successCount: results.filter(r => r.status === 'fulfilled').length 
    });
  } catch (error) {
    res.status(500).json({ error: "Cron settlement failed" });
  }
}