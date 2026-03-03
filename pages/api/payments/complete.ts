import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getApiBaseUrl } from '../../../lib/server-url';

const prisma = new PrismaClient();

import { processAutoBids } from '../../../services/auto_bid_service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentId, txid, debug } = req.body;

  try {
    // --- MOCK BYPASS ---
    if ((paymentId.startsWith('pay_mock_') || paymentId.startsWith('mock_')) && debug) {
      console.log(`🛠️ API: Completing Mock Payment ${paymentId}`);
      
      const { auctionId, amount, userId, username, maxBid } = debug;

      // 1. Place the primary bid
      await prisma.$transaction(async (tx) => {
        await tx.auctions.update({
          where: { id: Number(auctionId) },
          data: { currentBid: Number(amount) }
        });
        await tx.bids.create({
          data: {
            amount: Number(amount),
            bidder_id: username, 
            pi_payment_id: paymentId,
            auction: { connect: { id: Number(auctionId) } }
          }
        });

        // 2. Save Auto-Bid if provided
        if (maxBid && parseFloat(maxBid) > parseFloat(amount)) {
            await tx.auto_bids.create({
                data: {
                    auction_id: Number(auctionId),
                    bidder_id: username,
                    max_amount: parseFloat(maxBid)
                }
            });
        }
      });

      // 3. Trigger Auto-Bid Processing (Outside transaction to avoid locking)
      // We don't await this so the user gets a fast response
      processAutoBids(Number(auctionId), req).catch(err => console.error("Auto-Bid Error:", err));
      
      // 4. Emit Real-Time Update via multi-layered system (HTTP polling + Socket.IO)
      try {
          const baseUrl = getApiBaseUrl(req);
          
          // Try HTTP polling first (works with ngrok)
          await fetch(`${baseUrl}/api/http-poll?action=update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  auctionId: Number(auctionId),
                  newBid: Number(amount),
                  bidder: username,
                  type: 'bid_update'
              })
          });
          console.log(`🎯 Emitted bid_update via HTTP polling: Auction ${auctionId}, Bid ${amount} by ${username}`);
          
          // Also try Socket.IO (fallback for localhost)
          await fetch(`${baseUrl}/api/emit-bid-update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  auctionId: Number(auctionId),
                  newBid: Number(amount),
                  bidder: username
              })
          });
          console.log(`🎯 Emitted bid_update via Socket.IO: Auction ${auctionId}, Bid ${amount} by ${username}`);
      } catch (emitError) {
          console.error('❌ Failed to emit bid_update:', emitError);
      }

      return res.status(200).json({ success: true, mock: true });
    }

    // 1. Verify payment with Pi Server
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
    });
    
    const paymentData = await piRes.json();
    const auctionId = paymentData.metadata?.auctionId;
    const bidAmount = paymentData.amount;
    const bidderUsername = paymentData.metadata?.buyerUsername || paymentData.user_uid;
    const maxBid = paymentData.metadata?.maxBid; // Extract maxBid from metadata

    if (!auctionId) throw new Error("Missing auctionId in metadata");

    // 2. Database Transaction
    await prisma.$transaction(async (tx) => {
      // Update the auction row with the latest price
      await tx.auctions.update({
        where: { id: Number(auctionId) },
        data: { currentBid: Number(bidAmount) }
      });
      // Create the bid entry using the verified schema fields
      await tx.bids.create({
        data: {
          amount: Number(bidAmount),
          bidder_id: bidderUsername, 
          pi_payment_id: paymentId,
          auction: { connect: { id: Number(auctionId) } }
        }
      });

      // Save Auto-Bid if present in metadata
      if (maxBid && parseFloat(maxBid) > parseFloat(bidAmount)) {
          await tx.auto_bids.create({
              data: {
                  auction_id: Number(auctionId),
                  bidder_id: bidderUsername,
                  max_amount: parseFloat(maxBid)
              }
          });
      }
    });

    // 3. Complete the payment on Pi Servers
    await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 
        Authorization: `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ txid })
    });

    // 4. Trigger Auto-Bid Processing
    processAutoBids(Number(auctionId), req).catch(err => console.error("Auto-Bid Error:", err));

    // 5. Emit Real-Time Update via server endpoint
    try {
        const baseUrl = getApiBaseUrl(req);
        await fetch(`${baseUrl}/api/emit-bid-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auctionId: Number(auctionId),
                newBid: Number(bidAmount),
                bidder: bidderUsername
            })
        });
        console.log(`🎯 Emitted bid_update: Auction ${auctionId}, Bid ${bidAmount} by ${bidderUsername}`);
    } catch (emitError) {
        console.error('❌ Failed to emit bid_update:', emitError);
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('--- DATABASE SYNC ERROR ---');
    console.error(error.message);
    return res.status(500).json({ error: 'Failed to save bid', details: error.message });
  }
}