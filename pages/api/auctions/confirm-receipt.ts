import type { NextApiRequest, NextApiResponse } from 'next';
import { confirmDeliveryAndPayout } from '../../../services/payout_service';
import { prisma } from '../../../lib/prisma';

/**
 * API Handler for Buyer Confirmation
 * This releases the Pi funds from the Escrow Ledger to the Seller
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Guard: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auctionId, buyerId } = req.body;

  // 2. Logging for Debugging (Crucial for XAMPP/Local dev)
  console.log("-----------------------------------------");
  console.log(`📩 RECEIVED PAYOUT REQUEST:`);
  console.log(`   Auction ID: ${auctionId}`);
  console.log(`   Buyer UID:  ${buyerId}`);
  console.log("-----------------------------------------");

  // 3. Validation
  if (!auctionId || !buyerId) {
    return res.status(400).json({ 
      error: "Missing parameters. Required: auctionId, buyerId" 
    });
  }

  try {
    /**
     * 4. Execute Payout Logic
     * Passes the shared Prisma instance to ensure transaction safety.
     * This will:
     * - Check if an Escrow record exists
     * - Verify the payment hasn't already been released
     * - Call the Pi Network API (or Mock) to transfer funds
     * - Update Auction status to 'SETTLED_TO_SELLER'
     */
    const result = await confirmDeliveryAndPayout(
      Number(auctionId), 
      buyerId, 
      prisma
    );

    console.log(`✅ SUCCESS: Payout released for Auction #${auctionId}`);

    return res.status(200).json({ 
      success: true, 
      message: "Delivery confirmed. Payout released to seller!",
      txid: result.txid 
    });

  } catch (error: any) {
    // 5. Error Handling
    // This catches "No escrow record found" or "Network errors"
    console.error(`❌ PAYOUT ERROR for Auction #${auctionId}:`, error.message);
    
    return res.status(500).json({ 
      error: error.message || "Internal server error during payout." 
    });
  }
}