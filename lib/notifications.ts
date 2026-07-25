import { prisma } from './prisma';

export type NotificationType = 'OUTBID' | 'WON' | 'SOLD' | 'PAYOUT' | 'DELIVERY';

/**
 * Create an in-app notification for a user. Best-effort: never throws, so a
 * notification failure can't break the bid/settlement flow that triggered it.
 * If a Socket.IO server is present, also pushes to the user's room.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  message: string,
  auctionId?: number,
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.notifications.create({
      data: { user_id: userId, type, message, auction_id: auctionId ?? null },
    });

    const io = (global as any).io;
    if (io) {
      io.to(`user_${userId}`).emit('notification', { type, message, auctionId, at: Date.now() });
    }
  } catch (err) {
    console.error('notify() failed:', err);
  }
}
