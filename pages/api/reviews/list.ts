import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

/**
 * Public: list reviews for a user plus an aggregate rating.
 *   GET /api/reviews/list?userId=<username>
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = (req.query.userId || '').toString().replace('@', '');
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const reviews = await prisma.reviews.findMany({
      where: { ratee_id: userId },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.stars, 0) / count : 0;

    return res.status(200).json({
      userId,
      count,
      average: Math.round(average * 10) / 10,
      reviews,
    });
  } catch (error: any) {
    console.error('Review list error:', error.message);
    return res.status(500).json({ error: 'Failed to load reviews' });
  }
}
