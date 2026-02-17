import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
// 1. Only allow POST requests
if (req.method !== 'POST') {
return res.status(405).json({ message: 'Method Not Allowed' });
}

const { paymentId } = req.body;

if (!paymentId) {
return res.status(400).json({ error: "No paymentId provided" });
}

try {
// 2. Fetch payment details from Pi Servers to get the metadata
const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }});

if (!piRes.ok) {
  throw new Error("Failed to fetch payment details from Pi Network");
}

const payment = await piRes.json();
const auctionId = payment.metadata.auctionId;

// 3. Database Check: Ensure the auction exists and is open
// Note: Using parseInt if your DB uses Integer IDs
const auction = await prisma.auctions.findUnique({ 
  where: { id: parseInt(auctionId.toString()) } 
});

if (!auction || auction.status !== 'OPEN') {
  return res.status(400).json({ error: "Auction no longer available for bidding" });
}

// 4. THE CRITICAL STEP: Tell the Pi Server you approve of this payment
// This stops the infinite "Checking payment status" loop
const approveRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
  method: 'POST',
  headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
});

if (!approveRes.ok) {
  const errorData = await approveRes.json();
  console.error("Pi Server Approval Failed:", errorData);
  return res.status(500).json({ error: "Pi Network rejected the approval" });
}

// 5. Success: The Pi SDK will now proceed to the "Complete" step
return res.status(200).json({ approved: true });
} catch (error: any) {
console.error("Approve Route Crash:", error.message);
return res.status(500).json({
error: "Approval sync failed",
details: error.message
});
}
}