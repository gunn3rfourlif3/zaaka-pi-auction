import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getApiBaseUrl } from '../../../lib/server-url';
import { requireAuth } from '../../../lib/auth';
import { rateLimit } from '../../../lib/rateLimit';
import { processAutoBids } from '../../../services/auto_bid_service';
import { handleBidClockExtension } from '../../../services/auction_engine';
import { notify } from '../../../lib/notifications';
import { audit } from '../../../lib/audit';

/**
 * Minimum bid increment (in Pi). A new bid must exceed the current bid by at
 * least this much. Kept in code so it is enforced server-side, not just in UI.
 */
const MIN_INCREMENT = 0.1;

async function emitBidUpdate(req: NextApiRequest, auctionId: number, amount: number, bidder: string) {
  try {
    const baseUrl = getApiBaseUrl(req);
    await fetch(`${baseUrl}/api/http-poll?action=update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId, newBid: amount, bidder, type: 'bid_update' }),
    }).catch(() => {});
    await fetch(`${baseUrl}/api/emit-bid-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId, newBid: amount, bidder }),
    }).catch(() => {});
  } catch (emitError) {
    console.error('❌ Failed to emit bid_update:', emitError);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { name: 'bid', max: 60, windowMs: 60 * 1000 })) return;

  const { paymentId, txid, debug } = req.body || {};
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    // --- MOCK BYPASS (development/testing only) ---
    if ((paymentId.startsWith('pay_mock_') || paymentId.startsWith('mock_')) && debug) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ error: 'Mock payments are disabled in production.' });
      }
      console.log(`🛠️ API: Completing Mock Payment ${paymentId}`);

      const { auctionId, amount, username, maxBid } = debug;

      await prisma.$transaction(async (tx) => {
        await tx.auctions.update({
          where: { id: Number(auctionId) },
          data: { currentBid: Number(amount) },
        });
        await tx.bids.create({
          data: {
            amount: Number(amount),
            bidder_id: username,
            pi_payment_id: paymentId,
            auction: { connect: { id: Number(auctionId) } },
          },
        });
        if (maxBid && parseFloat(maxBid) > parseFloat(amount)) {
          await tx.auto_bids.create({
            data: { auction_id: Number(auctionId), bidder_id: username, max_amount: parseFloat(maxBid) },
          });
        }
      });

      processAutoBids(Number(auctionId), req).catch((err) => console.error('Auto-Bid Error:', err));
      await emitBidUpdate(req, Number(auctionId), Number(amount), username);
      return res.status(200).json({ success: true, mock: true });
    }

    // --- REAL PAYMENT PATH -------------------------------------------------
    // Require an authenticated Pi session.
    const session = requireAuth(req, res);
    if (!session) return;

    // 1. Verify the payment against the Pi Server. We trust ONLY the server's
    //    view of amount / uid / metadata — never values supplied by the client.
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
    });
    if (!piRes.ok) {
      return res.status(502).json({ error: 'Failed to verify payment with Pi Network' });
    }
    const paymentData: any = await piRes.json();

    const auctionId = paymentData.metadata?.auctionId;
    const bidAmount = Number(paymentData.amount);
    const bidderUsername = (paymentData.metadata?.buyerUsername || paymentData.user_uid || '').toString();
    const maxBid = paymentData.metadata?.maxBid;

    if (!auctionId) return res.status(400).json({ error: 'Missing auctionId in payment metadata' });
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // 2. Ensure the payment belongs to the authenticated user.
    if (paymentData.user_uid && paymentData.user_uid !== session.uid) {
      return res.status(403).json({ error: 'This payment does not belong to you.' });
    }

    // 3. Idempotency: if this payment was already recorded, don't double-count.
    const existing = await prisma.bids.findFirst({ where: { pi_payment_id: paymentId } });
    if (existing) {
      // Still make sure Pi marks it complete, then return success.
      await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Key ${process.env.PI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid }),
      }).catch(() => {});
      return res.status(200).json({ success: true, alreadyRecorded: true });
    }

    // 4. Persist the bid with validation inside a transaction (race-safe).
    //    Capture the bidder we're outbidding so we can notify them afterward.
    let outbidUser: string | null = null;
    await prisma.$transaction(async (tx) => {
      const auction = await tx.auctions.findUnique({ where: { id: Number(auctionId) } });
      if (!auction) throw new Error('AUCTION_NOT_FOUND');
      if (auction.status !== 'OPEN') throw new Error('AUCTION_CLOSED');

      const current = Number(auction.currentBid);
      // Enforce strictly-increasing bids with a minimum increment.
      if (bidAmount < current + MIN_INCREMENT) {
        throw new Error('BID_TOO_LOW');
      }

      // Current leader (about to be outbid), if any.
      const topBid = await tx.bids.findFirst({
        where: { auctionId: Number(auctionId) },
        orderBy: { amount: 'desc' },
      });
      if (topBid && topBid.bidder_id && topBid.bidder_id !== bidderUsername) {
        outbidUser = topBid.bidder_id;
      }

      await tx.auctions.update({
        where: { id: Number(auctionId) },
        data: { currentBid: bidAmount },
      });
      await tx.bids.create({
        data: {
          amount: bidAmount,
          bidder_id: bidderUsername,
          pi_payment_id: paymentId,
          auction: { connect: { id: Number(auctionId) } },
        },
      });
      if (maxBid && parseFloat(maxBid) > bidAmount) {
        await tx.auto_bids.create({
          data: { auction_id: Number(auctionId), bidder_id: bidderUsername, max_amount: parseFloat(maxBid) },
        });
      }
    });

    // 5. Complete the payment on Pi Servers.
    await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Key ${process.env.PI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid }),
    });

    // 6. Audit trail + outbid notification (best-effort, never blocks).
    audit({ eventType: 'BID', actor: bidderUsername, auctionId: Number(auctionId), amount: bidAmount, piPaymentId: paymentId });
    if (outbidUser) {
      notify(outbidUser, 'OUTBID', `You've been outbid on auction #${auctionId}. New bid: ${bidAmount} π.`, Number(auctionId));
    }

    // 7. Anti-sniping clock extension, auto-bids, and real-time update.
    handleBidClockExtension(Number(auctionId)).catch((err) => console.error('Clock extension error:', err));
    processAutoBids(Number(auctionId), req).catch((err) => console.error('Auto-Bid Error:', err));
    await emitBidUpdate(req, Number(auctionId), bidAmount, bidderUsername);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    // Map known validation errors to clean 4xx responses.
    const map: Record<string, [number, string]> = {
      AUCTION_NOT_FOUND: [404, 'Auction not found'],
      AUCTION_CLOSED: [400, 'Auction is no longer open for bidding'],
      BID_TOO_LOW: [400, 'Bid must exceed the current bid by the minimum increment'],
    };
    if (error?.message && map[error.message]) {
      const [code, msg] = map[error.message];
      return res.status(code).json({ error: msg });
    }
    console.error('--- BID SAVE ERROR ---', error.message);
    return res.status(500).json({ error: 'Failed to save bid', details: error.message });
  }
}
