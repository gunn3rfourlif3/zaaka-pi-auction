import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

/**
 * Leave a review for the counterpart of a completed auction.
 *
 * The rater is the authenticated user. We derive who they may review from the
 * escrow ledger — a buyer may review the seller and vice versa — so the client
 * cannot review an arbitrary user or an auction they weren't part of.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = requireAuth(req, res);
  if (!session) return;

  const { auctionId, stars, comment } = req.body || {};
  const starsNum = Number(stars);
  if (!auctionId || isNaN(Number(auctionId))) {
    return res.status(400).json({ error: 'Valid auctionId is required' });
  }
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    return res.status(400).json({ error: 'Stars must be an integer from 1 to 5' });
  }
  if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
    return res.status(400).json({ error: 'Comment must be a string up to 1000 characters' });
  }

  try {
    // A completed auction has an escrow ledger row identifying both parties.
    const ledger = await prisma.escrow_ledger.findFirst({
      where: { auction_id: Number(auctionId), payment_status: 'COMPLETED' },
    });
    if (!ledger) {
      return res.status(400).json({ error: 'This auction has not completed a sale yet.' });
    }

    // Determine the rater's role and their counterpart.
    let rateeId: string;
    let role: 'SELLER' | 'BUYER';
    if (session.username === ledger.winner_id) {
      rateeId = ledger.seller_id;
      role = 'SELLER'; // buyer reviews the seller
    } else if (session.username === ledger.seller_id) {
      rateeId = ledger.winner_id;
      role = 'BUYER'; // seller reviews the buyer
    } else {
      return res.status(403).json({ error: 'Only the buyer or seller of this auction can leave a review.' });
    }

    // One review per counterpart per auction (create or update).
    const existing = await prisma.reviews.findFirst({
      where: { auction_id: Number(auctionId), rater_id: session.username, ratee_id: rateeId },
    });

    const review = existing
      ? await prisma.reviews.update({
          where: { id: existing.id },
          data: { stars: starsNum, comment: comment || null },
        })
      : await prisma.reviews.create({
          data: {
            auction_id: Number(auctionId),
            rater_id: session.username,
            ratee_id: rateeId,
            role,
            stars: starsNum,
            comment: comment || null,
          },
        });

    return res.status(200).json({ success: true, review });
  } catch (error: any) {
    console.error('Review create error:', error.message);
    return res.status(500).json({ error: 'Failed to save review' });
  }
}
