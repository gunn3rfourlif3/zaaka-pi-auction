import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      title: "Premium Pi Pioneer Hoodie",
      description: "Limited edition heavy cotton hoodie with embroidered Pi logo.",
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800",
      startingBid: 20.0,
      currentBid: 24.5,
      sellerId: "zaaka_official",
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    },
    {
      title: "Refurbished DSLR Camera Kit",
      description: "Professional grade photography kit for creative pioneers.",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800",
      startingBid: 15.0,
      currentBid: 24.5,
      sellerId: "zaaka_official",
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12 hours from now
    },
    {
      title: "Vintage Pi Coin Physical Edition",
      description: "Rare commemorative physical coin with gold plating.",
      imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800",
      startingBid: 50.0,
      currentBid: 50.0,
      sellerId: "zaaka_official",
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 48), 
    }
  ];

  console.log("Emptying database...");
  await prisma.auction.deleteMany();

  console.log("Seeding SoccerBids items...");
  for (const item of items) {
    await prisma.auction.create({ data: item });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());