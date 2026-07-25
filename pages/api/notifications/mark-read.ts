import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

/**
 * Mark notifications read. POST /api/notifications/mark-read
 *   body: { id } to mark one, or {} to mark all of the user's as read.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.body || {};

  try {
    const result = await prisma.notifications.updateMany({
      // Scope to the caller's own rows so one user can't touch another's.
      where: id ? { id: Number(id), user_id: session.username } : { user_id: session.username, read: false },
      data: { read: true },
    });
    return res.status(200).json({ success: true, updated: result.count });
  } catch (error: any) {
    console.error('Notifications mark-read error:', error.message);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
}
