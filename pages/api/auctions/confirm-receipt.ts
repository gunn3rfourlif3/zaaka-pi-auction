import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { auctionId } = req.body;

  try {
    // START TRANSACTION: If any step fails, the whole thing rolls back
    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate the payment in the ledger
      const ledger = await tx.escrow_ledger.findFirst({
        where: { auction_id: Number(auctionId), payment_status: 'COMPLETED' }
      });

      if (!ledger) throw new Error("Rollback: No payment record found for this auction.");

      // 2. Update Auction Status
      await tx.auctions.update({
        where: { id: Number(auctionId) },
        data: { status: 'PAID_OUT' }
      });

      // 3. Update Ledger Payout Status
      return await tx.escrow_ledger.update({
        where: { id: ledger.id },
        data: { payout_status: 'SUCCESS' }
      });
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}