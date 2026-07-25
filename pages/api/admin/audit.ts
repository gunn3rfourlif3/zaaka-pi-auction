import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

/**
 * Admin-only read of the money-event audit trail.
 *   GET /api/admin/audit?auctionId=&eventType=&limit=
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = requireAdmin(req, res);
  if (!session) return;

  const { auctionId, eventType } = req.query;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const where: any = {};
  if (auctionId && !isNaN(Number(auctionId))) where.auction_id = Number(auctionId);
  if (eventType) where.event_type = String(eventType);

  try {
    const entries = await prisma.audit_log.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return res.status(200).json({ count: entries.length, entries });
  } catch (error: any) {
    console.error('Audit read error:', error.message);
    return res.status(500).json({ error: 'Failed to load audit log' });
  }
}
