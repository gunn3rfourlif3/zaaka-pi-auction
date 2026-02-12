import { redisClient } from '../lib/redis';
import { Server } from 'socket.io';

/**
 * Identifies the previous leader and notifies them they've been outbid.
 */
export async function handleOutbidNotification(
    io: Server, 
    auctionId: number, 
    newBidderId: string, 
    newAmount: number,
    itemName: string
) {
    const cacheKey = `auction:${auctionId}:top_bidder`;
    
    // 1. Get the previous high bidder stored in Redis
    const previousBidderId = await redisClient.get(cacheKey);

    // 2. Only notify if there was a previous bidder and it's not the current one
    if (previousBidderId && previousBidderId !== newBidderId) {
        const payload = {
            type: 'OUTBID',
            title: '🚨 You have been outbid!',
            message: `Someone just bid ${newAmount} Pi on "${itemName}".`,
            auctionId,
            newAmount
        };

        // 3. Emit via Socket.io to the specific user's private room
        io.to(previousBidderId).emit('notification', payload);
        console.log(`📡 Notification sent to outbid user: ${previousBidderId}`);
    }

    // 4. Update Redis with the new leader for the next bid event
    await redisClient.set(cacheKey, newBidderId);
}