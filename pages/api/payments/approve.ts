import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { paymentId, auctionId: debugAuctionId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: "No paymentId provided" });
  }

  // --- MOCK BYPASS (development/testing only) ---
  if (paymentId.startsWith('pay_mock_') || paymentId.startsWith('mock_')) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: "Mock payments are disabled in production." });
    }
    console.log(`🛠️ API: Mock Approval for ${paymentId}`);

    // Validate auction existence even in mock mode
    if (debugAuctionId) {
      const auction = await prisma.auctions.findUnique({
        where: { id: parseInt(debugAuctionId) }
      });
      if (!auction || auction.status !== 'OPEN') {
        return res.status(400).json({ error: "Auction no longer available" });
      }
    }

    return res.status(200).json({ approved: true, mock: true });
  }

  // Real payments require an authenticated Pi session.
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    // 2. Fetch payment details from Pi Servers to get the metadata
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
    });

    if (!piRes.ok) {
      throw new Error("Failed to fetch payment details from Pi Network");
    }

    const payment = await piRes.json();
    const auctionId = payment.metadata?.auctionId;
    if (!auctionId) {
      return res.status(400).json({ error: "Payment is missing auctionId metadata" });
    }

    // Ensure the payment belongs to the authenticated user.
    if (payment.user_uid && payment.user_uid !== session.uid) {
      return res.status(403).json({ error: "This payment does not belong to you." });
    }

    // 3. Database Check: Ensure the auction exists and is open
    const auction = await prisma.auctions.findUnique({
      where: { id: parseInt(auctionId.toString()) }
    });

    if (!auction || auction.status !== 'OPEN') {
      return res.status(400).json({ error: "Auction no longer available for bidding" });
    }

    // 4. Approve the payment on the Pi Server (stops the "Checking payment status" loop)
    const approveRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
    });

    if (!approveRes.ok) {
      const errorData = await approveRes.json();
      console.error("Pi Server Approval Failed:", errorData);
      return res.status(500).json({ error: "Pi Network rejected the approval" });
    }

    // 5. Success: the Pi SDK will now proceed to the "Complete" step
    return res.status(200).json({ approved: true });
  } catch (error: any) {
    console.error("Approve Route Crash:", error.message);
    return res.status(500).json({
      error: "Approval sync failed",
      details: error.message
    });
  }
}
