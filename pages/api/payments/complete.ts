import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentId, txid } = req.body;

  try {
    // 1. Verify payment with Pi Server
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
    });
    
    const paymentData = await piRes.json();
    const auctionId = paymentData.metadata?.auctionId;
    const bidAmount = paymentData.amount;
    const bidderUid = paymentData.user_uid;

    if (!auctionId) throw new Error("Missing auctionId in metadata");

    // 2. Database Transaction
    await prisma.$transaction([
      // Update the auction row with the latest price
      prisma.auctions.update({
        where: { id: Number(auctionId) },
        data: { currentBid: Number(bidAmount) }
      }),
      // Create the bid entry using the verified schema fields
      (prisma as any).bids.create({
        data: {
          amount: Number(bidAmount),
          bidder_id: bidderUid, 
          auction: { connect: { id: Number(auctionId) } }
          // Removed txid as it is not in your schema
        }
      })
    ]);

    // 3. Complete the payment on Pi Servers
    await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 
        Authorization: `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ txid })
    });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('--- DATABASE SYNC ERROR ---');
    console.error(error.message);
    return res.status(500).json({ error: 'Failed to save bid', details: error.message });
  }
}