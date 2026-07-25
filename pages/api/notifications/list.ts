import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

/**
 * List the authenticated user's notifications (most recent first) with an
 * unread count. GET /api/notifications/list
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const notifications = await prisma.notifications.findMany({
      where: { user_id: session.username },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.read).length;
    return res.status(200).json({ unread, notifications });
  } catch (error: any) {
    console.error('Notifications list error:', error.message);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
}
