import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding (50 Products) ---');

  // 1. Clean existing data (Optional, but recommended for clean testing)
  // await prisma.auction_images.deleteMany();
  // await prisma.bids.deleteMany();
  // await prisma.escrow_ledger.deleteMany();
  // await prisma.auctions.deleteMany();

  const categories = [
    'Electronics', 'Fashion', 'Collectibles', 'Home Goods', 
    'Vehicles', 'Comics', 'Art', 'Jewelry', 'Sports', 'Books'
  ];

  const sellers = Array.from({ length: 10 }, (_, i) => `seller_${i + 1}`);

  const products = [
    { title: 'Vintage Camera', desc: 'Old-school film camera in great condition.' },
    { title: 'Modern Headphones', desc: 'Noise-canceling wireless headphones.' },
    { title: 'Handmade Vase', desc: 'Beautiful ceramic vase for your living room.' },
    { title: 'Silk Scarf', desc: 'Elegant 100% silk scarf from Italy.' },
    { title: 'Graphic Novel', desc: 'Limited edition first print of a popular series.' },
    { title: 'Abstract Painting', desc: 'Original acrylic on canvas by a local artist.' },
    { title: 'Smart Watch', desc: 'Latest health tracking features included.' },
    { title: 'Silver Ring', desc: 'Handcrafted sterling silver ring with turquoise.' },
    { title: 'Camping Tent', desc: '2-person lightweight tent for hiking.' },
    { title: 'Hardcover Book', desc: 'Bestselling sci-fi novel with author signature.' }
  ];

  // Dummy image URLs (placeholder service)
  const getDummyImages = (seed: number) => [
    `https://picsum.photos/seed/${seed}a/400/300`,
    `https://picsum.photos/seed/${seed}b/400/300`,
    `https://picsum.photos/seed/${seed}c/400/300`
  ];

  for (let i = 0; i < 50; i++) {
    const productBase = products[i % products.length];
    const seller = sellers[i % sellers.length];
    const category = categories[i % categories.length];
    const price = (Math.random() * 4 + 0.5).toFixed(2); // Between 0.5 and 4.5 Pi
    
    // Random expiry between 5 and 25 minutes from now
    const minutesToExpiry = Math.floor(Math.random() * 20) + 5;
    const expiresAt = new Date(Date.now() + minutesToExpiry * 60 * 1000);

    const auction = await prisma.auctions.create({
      data: {
        title: `${productBase.title} #${i + 1}`,
        description: productBase.desc,
        currentBid: price,
        seller_id: seller,
        category: category,
        status: 'OPEN',
        delivered: false,
        expires_at: expiresAt,
        starts_at: new Date(),
        images: {
          create: getDummyImages(i).map(url => ({ url }))
        }
      }
    });

    console.log(`Created auction: ${auction.title} by ${seller} (Expires in ${minutesToExpiry}m)`);
  }

  console.log('--- Seeding Complete! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
