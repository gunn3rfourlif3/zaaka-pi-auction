import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Fashion', 'Electronics', 'Collectibles', 'Home Goods', 'Vehicles', 'Comics', 'Art', 'Jewelry', 'Sports', 'Books'];

// A pool of dummy images to rotate through
const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", // Watch
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", // Headphones
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", // Sneaker
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", // Camera
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80", // Joystick
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomImages() {
  const shuffled = DUMMY_IMAGES.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(url => ({ url }));
}

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create 28 random auctions (leaving 2 slots for the specific user request)
  // All under 5 Pi, expiring in < 30 mins
  for (let i = 0; i < 28; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const sellerId = `user_${getRandomInt(1000, 9999)}`;
    const startPrice = parseFloat((Math.random() * 4 + 0.1).toFixed(2)); // 0.1 to 4.1
    
    // Expires between 1 and 29 minutes from now
    const minutesUntilExpiry = getRandomInt(1, 29);
    const expiresAt = new Date(Date.now() + minutesUntilExpiry * 60 * 1000);

    await prisma.auctions.create({
      data: {
        title: `${category} Item #${i + 1}`,
        description: `This is a randomly generated ${category} item for testing purposes.`,
        currentBid: startPrice,
        seller_id: sellerId,
        category: category,
        status: 'OPEN',
        delivered: false,
        starts_at: new Date(),
        expires_at: expiresAt,
        images: {
          create: getRandomImages()
        }
      }
    });
  }

  console.log("✅ Created 28 random auctions.");

  // 2. Create 2 auctions specifically for "gunn3rfourl1f3" to simulate seller view
  // Each with 3 bids
  const myUser = "gunn3rfourl1f3";
  const bidders = ["bidder_alpha", "bidder_beta", "bidder_gamma"];

  for (let i = 1; i <= 2; i++) {
    const startPrice = 1.00;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const auction = await prisma.auctions.create({
      data: {
        title: `My Seller Item #${i}`,
        description: "This is one of my items to test the seller dashboard.",
        currentBid: startPrice, // Will update after bids
        seller_id: myUser,
        category: 'Electronics',
        status: 'OPEN',
        starts_at: new Date(),
        expires_at: expiresAt,
        images: {
          create: getRandomImages()
        }
      }
    });

    // Place 3 bids
    let currentBid = startPrice;
    for (const bidder of bidders) {
      currentBid += 0.5; // Increment by 0.5
      await prisma.bids.create({
        data: {
          amount: currentBid,
          bidder_id: bidder,
          auctionId: auction.id,
          // Mock payment ID for testing
          pi_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}` 
        }
      });
    }

    // Update auction with final bid amount
    await prisma.auctions.update({
      where: { id: auction.id },
      data: { currentBid: currentBid }
    });
  }

  console.log(`✅ Created 2 auctions for seller: ${myUser} with 3 bids each.`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
