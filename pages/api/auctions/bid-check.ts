import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { auctionId, bidAmount } = req.body;

    // 2. Validate input existence
    if (!auctionId || !bidAmount) {
      return res.status(400).json({ error: 'Missing auctionId or bidAmount' });
    }

    // 3. Find auction in DB
    const auction = await prisma.auctions.findUnique({
      where: { id: Number(auctionId) },
    });

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // 4. Logic Checks
    if (auction.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This auction has been cancelled.' });
    }

    const now = new Date();
    if (new Date(auction.expires_at) < now) {
      return res.status(400).json({ error: 'Auction has expired.' });
    }

    // 5. Bid Amount Check
    const currentPrice = Number(auction.currentBid);
    const newBid = parseFloat(bidAmount);

    if (newBid <= currentPrice) {
      return res.status(400).json({ 
        error: `Bid too low. Minimum bid is ${(currentPrice + 0.01).toFixed(2)} π` 
      });
    }

    // 6. All clear
    return res.status(200).json({ success: true });

  } catch (error: any) {
    // This logs the actual error to your VS Code terminal
    console.error('--- DATABASE CRASH LOG ---');
    console.error(error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}