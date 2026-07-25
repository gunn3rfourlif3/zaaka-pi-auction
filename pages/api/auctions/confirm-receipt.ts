import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";
import { requireAuth, isAdmin } from "../../../lib/auth";
import { audit } from "../../../lib/audit";
import { notify } from "../../../lib/notifications";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // Must be signed in; only the winning buyer (or an admin) may confirm receipt,
  // since confirming triggers release of escrowed funds to the seller.
  const session = requireAuth(req, res);
  if (!session) return;

  const { auctionId } = req.body;
  if (!auctionId || isNaN(Number(auctionId))) {
    return res.status(400).json({ error: "Valid auctionId is required" });
  }

  try {
    // START TRANSACTION: If any step fails, the whole thing rolls back
    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate the payment in the ledger
      const ledger = await tx.escrow_ledger.findFirst({
        where: { auction_id: Number(auctionId), payment_status: 'COMPLETED' }
      });

      if (!ledger) throw new Error("Rollback: No payment record found for this auction.");

      // Authorization: only the winner (or an admin) may confirm delivery.
      if (ledger.winner_id !== session.username && !isAdmin(session)) {
        throw new Error("FORBIDDEN");
      }

      // 2. Update Auction Status
      await tx.auctions.update({
        where: { id: Number(auctionId) },
        data: { status: 'PAID_OUT' }
      });

      // 3. Update Ledger Payout Status
      const updated = await tx.escrow_ledger.update({
        where: { id: ledger.id },
        data: { payout_status: 'SUCCESS' }
      });

      // 4. Audit (atomic) + notify the seller that delivery was confirmed.
      await audit({
        eventType: 'CONFIRM',
        actor: session.username,
        auctionId: Number(auctionId),
        amount: Number(ledger.amount),
        piPaymentId: ledger.pi_payment_id || null,
        meta: { seller: ledger.seller_id },
      }, tx);
      notify(ledger.seller_id, 'DELIVERY', `Buyer confirmed delivery for auction #${auctionId}.`, Number(auctionId));

      return updated;
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") {
      return res.status(403).json({ success: false, error: "Only the winning buyer can confirm receipt." });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}