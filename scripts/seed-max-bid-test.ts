import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Fashion', 'Electronics', 'Collectibles', 'Home Goods', 'Vehicles', 'Comics', 'Art', 'Jewelry', 'Sports', 'Books'];
const USERS = ['tester1', 'tester2', 'tester3', 'tester4', 'max_bidder_pro', 'sniper_elite'];

async function seed() {
  console.log("🌱 Seeding 100 items for Max Bid testing...");

  const items = [];
  const now = Date.now();

  for (let i = 0; i < 100; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const seller = USERS[Math.floor(Math.random() * USERS.length)];
    const startPrice = parseFloat((Math.random() * 4 + 0.1).toFixed(2)); // 0.1 to 4.1
    const expiryMinutes = Math.floor(Math.random() * 55) + 5; // 5 to 60 minutes

    items.push({
      title: `${category} Item #${i + 1} - Test`,
      description: `A unique ${category} item for testing Max Bid functionality.`,
      // startPrice: startPrice, // Removed as per error
      currentBid: startPrice,
      seller_id: seller,
      category: category,
      status: 'OPEN',
      // image_url: `https://picsum.photos/seed/${i + 100}/400/400`, // Removed as per error, likely not in schema
      created_at: new Date(),
      expires_at: new Date(now + expiryMinutes * 60000),
    });
  }

  // Batch create auctions
  // Note: Prisma createMany does not return IDs in all DBs, so we might need loop if we want to add bids immediately.
  // But for speed, we'll create them, then fetch them back.
  
  await prisma.auctions.createMany({ data: items });
  
  console.log("✅ Created 100 auctions.");

  // Fetch them back to add images and random bids
  const createdAuctions = await prisma.auctions.findMany({
    where: { title: { contains: 'Test' }, status: 'OPEN' },
    orderBy: { created_at: 'desc' },
    take: 100
  });

  console.log("📸 Adding images and random bids...");

  for (const auction of createdAuctions) {
    // 1. Add 3 Images
    await prisma.auction_images.createMany({
      data: [
        { auctionId: auction.id, url: `https://picsum.photos/seed/${auction.id}_1/400/400` },
        { auctionId: auction.id, url: `https://picsum.photos/seed/${auction.id}_2/400/400` },
        { auctionId: auction.id, url: `https://picsum.photos/seed/${auction.id}_3/400/400` }
      ]
    });

    // 2. Add random bids to ~50% of items
    if (Math.random() > 0.5) {
      const bidder = USERS[Math.floor(Math.random() * USERS.length)];
      if (bidder !== auction.seller_id) {
        const bidAmount = Number(auction.currentBid) + 0.5;
        
        await prisma.$transaction([
          prisma.auctions.update({
            where: { id: auction.id },
            data: { currentBid: bidAmount }
          }),
          prisma.bids.create({
            data: {
              amount: bidAmount,
              bidder_id: bidder,
              pi_payment_id: `seed_bid_${Date.now()}_${auction.id}`,
              auction: { connect: { id: auction.id } }
            }
          })
        ]);
        
        // 10% chance to add a Max Bid for this user
        if (Math.random() > 0.9) {
             await prisma.auto_bids.create({
                data: {
                    auction_id: auction.id,
                    bidder_id: bidder,
                    max_amount: bidAmount + 5.0 // Strong max bid
                }
            });
            console.log(`🤖 Auto-bid set for Auction #${auction.id} by ${bidder}`);
        }
      }
    }
  }

  console.log("🎉 Seeding complete! 100 items ready.");
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
