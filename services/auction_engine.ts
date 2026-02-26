import { db } from '../lib/db';
import { io } from '../index'; // Your Socket.io server

export async function handleBidClockExtension(auctionId: number) {
    const SNIPE_WINDOW_MS = 60 * 1000; // 60 seconds
    const EXTENSION_TIME_MS = 5 * 60 * 1000; // 5 minute extension

    const auction = await db.auctions.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== 'ACTIVE') return;

    const now = new Date();
    const expiryTime = new Date(auction.expires_at);
    const timeRemaining = expiryTime.getTime() - now.getTime();

    // If bid is in the final 60 seconds, extend it
    if (timeRemaining > 0 && timeRemaining < SNIPE_WINDOW_MS) {
        const newExpiryTime = new Date(expiryTime.getTime() + EXTENSION_TIME_MS);
        
        await db.auctions.update({
            where: { id: auctionId },
            data: { expires_at: newExpiryTime }
        });

        // Notify all pioneers in the room of the new time
        io.to(`auction_${auctionId}`).emit('clock_extended', {
            new_end_time: newExpiryTime.toISOString(),
            message: "🔥 Anti-Sniping: 5 minutes added!"
        });
    }
}