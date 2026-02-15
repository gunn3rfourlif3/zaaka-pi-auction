import type { NextApiRequest, NextApiResponse } from 'next';
import { confirmDeliveryAndPayout } from '../../../services/payout_service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { auctionId, buyerId } = req.body;

  // 2. Validate input
  if (!auctionId || !buyerId) {
    return res.status(400).json({ error: 'Missing auctionId or buyerId' });
  }

  try {
    console.log(`📩 RECEIVED PAYOUT REQUEST: Auction ID: ${auctionId}, Buyer: ${buyerId}`);

    // 3. Call the Payout Service
    const result = await confirmDeliveryAndPayout(Number(auctionId), String(buyerId));

    // 4. Return success
    return res.status(200).json({
      success: true,
      message: 'Payout completed successfully',
      txid: result.txid
    });

  } catch (error: any) {
    console.error("❌ API ERROR:", error.message);

    // 5. Detailed error handling for the frontend
    if (error.message.includes('No escrow record')) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: 'Internal Server Error during payout',
      details: error.message 
    });
  }
}