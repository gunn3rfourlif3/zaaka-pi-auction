import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { payment } = req.body;

  if (!payment || !payment.identifier) {
    return res.status(400).json({ error: "Invalid payment object provided" });
  }

  const paymentId = payment.identifier;

  try {
    console.log(`Verifying incomplete payment: ${paymentId}`);
    // 1. Fetch current payment state from Pi Server
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
    });
    
    if (!piRes.ok) {
      const errorText = await piRes.text();
      console.error(`Pi API Error (${piRes.status}):`, errorText);
      throw new Error(`Pi Network verification failed: ${piRes.status} ${errorText}`);
    }
    
    const paymentData = await piRes.json();
    console.log("Payment Data received:", JSON.stringify(paymentData, null, 2));
    
    let metadata = paymentData.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
        console.log("Parsed metadata string to object:", metadata);
      } catch (e) {
        console.warn("Failed to parse metadata string:", metadata);
      }
    }

    const rawAuctionId = metadata?.auctionId;
    const bidAmount = paymentData.amount;
    const bidderUsername = metadata?.buyerUsername || paymentData.user_uid;
    const txid = paymentData.transaction?.txid;

    if (!rawAuctionId) {
      console.error("Missing auctionId in metadata:", metadata);
      throw new Error("Missing auctionId in payment metadata");
    }

    const auctionId = Number(rawAuctionId);
    if (isNaN(auctionId)) {
      console.error("Invalid auctionId (not a number):", rawAuctionId);
      throw new Error(`Invalid auctionId provided: ${rawAuctionId}`);
    }

    // 2. Database Transaction
    // Now that Prisma is generated, we can use standard findFirst and create
    const existingBid = await prisma.bids.findFirst({
      where: { pi_payment_id: paymentId }
    });

    if (!existingBid && txid) {
      console.log(`Recovering bid for auction ${auctionId}, amount ${bidAmount}`);
      await prisma.$transaction([
        prisma.auctions.update({
          where: { id: auctionId },
          data: { currentBid: Number(bidAmount) }
        }),
        prisma.bids.create({
          data: {
            amount: Number(bidAmount),
            bidder_id: bidderUsername,
            pi_payment_id: paymentId,
            auction: { connect: { id: auctionId } }
          }
        })
      ]);
      console.log(`✅ Incomplete payment ${paymentId} recovered in database.`);
    } else if (existingBid) {
      console.log(`Bid already exists for payment ${paymentId}.`);
    }

    // 3. If the payment is NOT yet completed on Pi server but has a transaction
    if (paymentData.status.developer_completed === false && txid) {
      console.log(`Completing payment ${paymentId} on Pi Server...`);
      const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 
          Authorization: `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ txid })
      });
      
      if (!completeRes.ok) {
        const completeError = await completeRes.text();
        console.error(`Pi Completion Error (${completeRes.status}):`, completeError);
        // We don't necessarily want to fail the whole request if DB was updated
      } else {
        console.log(`✅ Incomplete payment ${paymentId} marked as completed on Pi server.`);
      }
    }

    return res.status(200).json({ success: true, message: "Payment processed successfully" });

  } catch (error: any) {
    console.error('--- INCOMPLETE PAYMENT ERROR ---');
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    
    // Determine the status code - if it's a Pi API error, maybe use that?
    const statusCode = error.message.includes('Pi Network verification failed') ? 401 : 500;
    
    return res.status(statusCode).json({ 
      error: 'Failed to process incomplete payment', 
      details: error.message,
      pi_api_key_exists: !!process.env.PI_API_KEY,
      pi_api_key_prefix: process.env.PI_API_KEY ? `${process.env.PI_API_KEY.substring(0, 5)}...` : 'none',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
