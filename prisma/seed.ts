import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  try {
    await prisma.bids.deleteMany();
    await prisma.auction_images.deleteMany();
    await prisma.escrow_ledger.deleteMany();
    await prisma.auctions.deleteMany();
  } catch (e) { console.log("Cleanup: Tables already clear."); }

  // 50 Hand-picked IDs mapped to categories to ensure relevance and display
  const categoryMap: Record<string, { titles: string[], ids: string[] }> = {
    'Fashion': {
      titles: ['Luxury Gold Watch', 'Designer Sneakers', 'Leather Handbag', 'Vintage Denim Jacket', 'Silk Scarf'],
      ids: ['1523275335684-37898b6baf30', '1542291026-7eec264c27ff', '1584917865442-de89df76afd3', '1551028150-64b9f398f678', '1606760227071-39d6750d1b7c']
    },
    'Electronics': {
      titles: ['Macbook Pro M2', 'Sony Wireless Headphones', 'Mirrorless Camera', 'Mechanical Keyboard', 'Smart Home Hub'],
      ids: ['1496181133206-80ce9b88a853', '1505740420928-5e560c06d30e', '1516035069371-29a1b244cc32', '1587829741301-bc7ba9999381', '1558002038-1055907df8a7']
    },
    'Collectibles': {
      titles: ['Rare Vinyl Record', 'Antique Compass', 'Retro Game Console', 'First Edition Novel', 'Vintage Camera'],
      ids: ['1603048588665-791ca89717a0', '1580238053495-b9720401fd45', '1493711662062-fa541ada3fc8', '1544947950-fa07a98d237f', '1514997660455-45a30616946c']
    },
    'Home Goods': {
      titles: ['Minimalist Desk Lamp', 'Ergonomic Office Chair', 'Ceramic Vase Set', 'Espresso Machine', 'Abstract Wall Art'],
      ids: ['1507473885765-e6ed057f782c', '1592078615290-033ee584e267', '1581783898377-1c85bf937427', '1517701550927-30cf4bef8d52', '1579783902614-a3fb3927b6a5']
    },
    'Vehicles': {
      titles: ['Model Sports Car', 'Carbon Fiber Helmet', 'Electric Scooter', 'Classic Hubcap', 'Leather Keychain'],
      ids: ['1581235720704-06d3acfcba80', '1596728321064-3dd47f63231a', '1558444458-30017a4457fd', '1549234839016-59938a463298', '1622728468729-f64f40f09b55']
    }
    // Added logic below will repeat/cycle these categories for all 50 items
  };

  const categoryNames = Object.keys(categoryMap);

  console.log('Seeding 50 category-appropriate items under 10 Pi...');
  for (let i = 0; i < 50; i++) {
    const category = categoryNames[i % categoryNames.length];
    const data = categoryMap[category];
    const setIndex = Math.floor((i / categoryNames.length) % 5);
    const imageId = data.ids[setIndex];

    await prisma.auctions.create({
      data: {
        title: `${data.titles[setIndex]} Lot ${i + 1}`,
        description: `This ${data.titles[setIndex]} is a verified listing in the ${category} category. Mint condition.`,
        category: category,
        currentBid: (Math.random() * (9.99 - 0.50) + 0.50).toFixed(2),
        seller_id: `pioneer_${100 + i}`,
        status: 'OPEN',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * (24 + i)),
        images: {
          create: [{ url: `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=800&q=80` }]
        }
      }
    });
  }

  console.log('Seeding 5 specific electronics for @gunn3rfourl1f3...');
  const myUsername = 'gunn3rfourl1f3';
  const mySpecialIds = [
    '1517336714731-28968d8efc34', // Laptop close up
    '1525598912003-663126343e74', // Smartphone
    '1588872657578-7efd1f1555ed', // Tablet
    '1544244015-0df4b3ffc6b0', // Smartwatch
    '1592899677977-9c10ca588bbd'  // Headphones
  ];

  for (let j = 0; j < 5; j++) {
    await prisma.auctions.create({
      data: {
        title: `Elite Tech Asset #${j + 1}`,
        description: `Personal electronics from @${myUsername}. Guaranteed high-performance.`,
        category: 'Electronics',
        currentBid: (1.20 + (j * 1.5)).toFixed(2),
        seller_id: myUsername,
        status: 'OPEN',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        images: {
          create: [{ url: `https://images.unsplash.com/photo-${mySpecialIds[j]}?auto=format&fit=crop&w=800&q=80` }]
        }
      }
    });
  }

  console.log('Seeding complete! 🌱 55 category-perfect items under 10 Pi.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });