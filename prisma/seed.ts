import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const myUsername = "gunn3rfourl1f3"; // Exact string from Pi SDK

  const inventoryItems = [
    {
      title: "Rare Black Opal Ring",
      description: "Natural black opal set in 18k white gold.",
      price: 120.50,
      imgs: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
        "https://images.unsplash.com/photo-1603561591411-071c4f713932?w=800",
        "https://images.unsplash.com/photo-1635767791022-343af745d28a?w=800"
      ]
    },
    {
      title: "1996 Bulls Jersey",
      description: "Hand-signed by the 1996 championship team.",
      price: 2500.00,
      imgs: [
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800",
        "https://images.unsplash.com/photo-1546510806-a9466716a23b?w=800",
        "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800"
      ]
    },
    {
      title: "MacBook Pro M3",
      description: "Brand new, sealed 14-inch model.",
      price: 1450.00,
      imgs: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "https://images.unsplash.com/photo-1611186871348-b1ec696e5237?w=800",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800"
      ]
    }
  ];

  for (const item of inventoryItems) {
    await prisma.auctions.create({
      data: {
        title: item.title,
        description: item.description,
        currentBid: item.price,
        seller_id: myUsername,
        status: "OPEN",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        images: { create: item.imgs.map(url => ({ url })) }
      }
    });
  }
  console.log('✅ Inventory seeded for gunn3rfourl1f3');
}

main().catch(console.error).finally(() => prisma.$disconnect());