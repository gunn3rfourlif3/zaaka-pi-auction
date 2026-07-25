import { prisma } from '../lib/prisma';

/**
 * Anti-sniping: if a bid lands in the final SNIPE_WINDOW before expiry, extend
 * the auction by EXTENSION_TIME so other bidders have a fair chance to respond.
 *
 * Call this after a bid is recorded (e.g. from payments/complete).
 */
export async function handleBidClockExtension(auctionId: number) {
    const SNIPE_WINDOW_MS = 60 * 1000; // 60 seconds
    const EXTENSION_TIME_MS = 5 * 60 * 1000; // 5 minute extension

    const auction = await prisma.auctions.findUnique({ where: { id: auctionId } });
    // Auctions live with status 'OPEN' until they are settled/closed.
    if (!auction || auction.status !== 'OPEN') return;

    const now = new Date();
    const expiryTime = new Date(auction.expires_at);
    const timeRemaining = expiryTime.getTime() - now.getTime();

    // If the bid is in the final window, extend the clock.
    if (timeRemaining > 0 && timeRemaining < SNIPE_WINDOW_MS) {
        const newExpiryTime = new Date(expiryTime.getTime() + EXTENSION_TIME_MS);

        await prisma.auctions.update({
            where: { id: auctionId },
            data: { expires_at: newExpiryTime }
        });

        // Notify everyone watching this auction of the new end time.
        const io = (global as any).io;
        if (io) {
            io.to(`auction_${auctionId}`).emit('clock_extended', {
                auctionId,
                new_end_time: newExpiryTime.toISOString(),
                message: "Anti-Sniping: 5 minutes added!"
            });
        }
    }
}
