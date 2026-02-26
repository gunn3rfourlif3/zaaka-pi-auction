import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { processAuctionEscrow } from './settlement_service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * ZAAKA HEARTBEAT SYNC (Automated)
 * Checks every 10 seconds for expired auctions and settles them.
 */
cron.schedule('*/10 * * * * *', async () => {
    const now = new Date();

    try {
        // 1. Identify auctions that just expired
        const expired = await prisma.auctions.findMany({
            where: {
                expires_at: { lt: now },
                status: 'OPEN'
            }
        });

        for (const auction of expired) {
            console.log(`⏰ Time up for Auction #${auction.id}. Starting Automation...`);

            // 2. Mark as COMPLETED to lock out new bids immediately
            await prisma.auctions.update({
                where: { id: auction.id },
                data: { status: 'COMPLETED' }
            });

            // 3. Trigger the Financial Settlement & Escrow Handshake
            // This handles the Pi Blockchain API call and Ledger entry
            await processAuctionEscrow(auction.id, prisma);
        }
    } catch (error) {
        console.error("❌ Automation Error:", error);
    }
});

console.log("🛰️ Zaaka Heartbeat Sync & Auto-Settlement Active...");