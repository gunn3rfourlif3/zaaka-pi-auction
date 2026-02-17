import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { paymentId, txid } = req.body; // From Pi SDK

  try {
    // 1. Tell Pi Server to complete the transaction
    await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid }) // Submit blockchain hash
    });

    // 2. Get the official payment record to extract final data
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
    });
    const payment = await piRes.json();

    // 3. UPDATE MYSQL: Sanitize the amount to Number format
    const updatedAuction = await prisma.auctions.update({
      where: { id: payment.metadata.auctionId },
      data: {
        currentBid: Number(payment.amount), // Standardize Decimal -> Number
        highBidderId: payment.user_uid,
        lastTransactionId: txid
      }
    });

    return res.status(200).json({ success: true, auction: updatedAuction });
  } catch (error: any) {
    console.error("DB Sync Error:", error);
    return res.status(500).json({ error: "Failed to finalize bid" });
  }
}