import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') {
return res.status(405).json({ message: 'Method Not Allowed' });
}

const { auctionId, bidAmount, userUid } = req.body;

if (!auctionId || !bidAmount || !userUid) {
return res.status(400).json({ error: "Missing required bid data." });
}

try {
// FIX: Ensure auctionId is an Integer if your DB uses Int IDs
const numericId = parseInt(auctionId.toString());

const auction = await prisma.auctions.findUnique({
  where: { id: numericId },
});

if (!auction) {
  return res.status(404).json({ error: "Auction not found." });
}

if (auction.status !== 'OPEN') {
  return res.status(400).json({ error: "Auction is closed." });
}

if (userUid === auction.highBidderId) {
  return res.status(400).json({ error: "You are already the high bidder!" });
}

// FIX: Safer Decimal to Number conversion**
const currentPrice = auction.currentBid ? Number(auction.currentBid) : 0;
const proposedBid = parseFloat(bidAmount);

if (proposedBid <= currentPrice) {
  return res.status(400).json({ 
    error: "Bid too low. Current price is " + currentPrice.toFixed(2) + " π" 
  });
}

return res.status(200).json({ valid: true });
} catch (error: any) {
// This will show up in your TERMINAL (not browser console)
console.error("DATABASE CRASH:", error);
return res.status(500).json({
error: "Database connection error",
details: error.message
});
}
}