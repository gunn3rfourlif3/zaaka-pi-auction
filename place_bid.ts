import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';
import { handleOutbidNotification } from './services/notification_service';
import { connectRedis } from './lib/redis';

// --- NEW LOGIC: ANTI-SNIPING EXTENSION ---
async function handleClockExtension(tx: any, auctionId: number) {
    const SNIPE_WINDOW_MS = 60 * 1000; // 60 seconds
    const EXTENSION_TIME_MS = 5 * 60 * 1000; // 5 minute extension

    const auction = await tx.auctions.findUnique({ where: { id: auctionId } });
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const timeRemaining = endTime.getTime() - now.getTime();

    // If bid is placed in the last 60 seconds, extend end_time by 5 mins
    if (timeRemaining > 0 && timeRemaining < SNIPE_WINDOW_MS) {
        const newEndTime = new Date(endTime.getTime() + EXTENSION_TIME_MS);
        await tx.auctions.update({
            where: { id: auctionId },
            data: { end_time: newEndTime }
        });
        console.log(`⏰ Anti-Sniping Triggered: Extended to ${newEndTime.toISOString()}`);
        return newEndTime;
    }
    return null;
}

/**
 * Places a bid with Auction Clock / Anti-Sniping integration
 */
async function placeBid(auctionId: number, bidderId: string, bidAmount: number, io?: any) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        await connectRedis(); 
        console.log(`⏳ Processing bid of ${bidAmount} Pi for User: ${bidderId}...`);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Lock auction and validate
            const auction = await tx.auctions.findUnique({ where: { id: auctionId } });

            if (!auction) throw new Error("Auction not found.");
            if (auction.status !== 'ACTIVE') throw new Error("Auction is closed.");
            if (auction.seller_id === bidderId) throw new Error("Self-bidding forbidden.");

            const currentPrice = Number(auction.current_bid);
            if (bidAmount <= currentPrice) throw new Error(`Current bid is ${currentPrice} Pi.`);

            // 2. Execute Clock Extension (Anti-Sniping)
            const extendedTime = await handleClockExtension(tx, auctionId);

            // 3. Record the bid
            const newBid = await tx.bids.create({
                data: {
                    auction_id: auctionId,
                    bidder_id: bidderId,
                    amount: bidAmount,
                    status: "APPROVED" // Assuming Pi Server-Side Approval passed
                }
            });

            // 4. Update current price
            await tx.auctions.update({
                where: { id: auctionId },
                data: { current_bid: bidAmount }
            });

            return { newBid, itemName: auction.title, extendedTime };
        });

        // 5. Trigger Notifications and Socket Updates
        if (io) {
            // Notify the user who was just outbid
            await handleOutbidNotification(io, auctionId, bidderId, bidAmount, result.itemName);
            
            // If the clock was extended, broadcast the new time to all users
            if (result.extendedTime) {
                io.emit('clock_updated', { 
                    auctionId, 
                    newEndTime: result.extendedTime 
                });
            }
        }

        console.log(`✅ SUCCESS: ${bidderId} is high bidder!`);

    } catch (error: any) {
        console.error(`❌ BID REJECTED: ${error.message}`);
    } finally {
        await pool.end();
    }
}