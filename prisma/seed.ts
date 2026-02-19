import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Database ---');
  // Using try/catch to handle potential table name variations
  try { await (prisma as any).image.deleteMany(); } catch (e) {}
  try { await (prisma as any).auctions.deleteMany(); } catch (e) {}

  console.log('--- Seeding Tech Gadgets Under 5 Pi ---');

  const gadgets = [
    {
      title: "Magnetic USB-C Cable",
      desc: "Fast charging 100W magnetic cable with 3 tips. Perfect for desk setups.",
      price: 0.85,
      images: [
        "https://images.unsplash.com/photo-1589492477829-5e65395b66cc",
        "https://images.unsplash.com/photo-1619193100248-f67f295b5b77",
        "https://images.unsplash.com/photo-1588505794452-9e59a9a35b97"
      ]
    },
    {
      title: "RGB Mouse Pad (XL)",
      desc: "Extra large gaming surface with 12 lighting modes and micro-weave cloth.",
      price: 1.20,
      images: [
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7",
        "https://images.unsplash.com/photo-1593305841991-05c297ba4575",
        "https://images.unsplash.com/photo-1629429464245-4bb691ee2471"
      ]
    },
    {
      title: "Portable Mini Fan",
      desc: "USB-C rechargeable desk fan. Silent motor with 3 speed settings.",
      price: 0.50,
      images: [
        "https://images.unsplash.com/photo-1591035897819-f4bdf739f446",
        "https://images.unsplash.com/photo-1585338107529-13afc5f02586",
        "https://images.unsplash.com/photo-1619362224246-7d637171f1d6"
      ]
    },
    {
      title: "AirPods Silicone Case",
      desc: "Premium liquid silicone case with carabiner. Military grade protection.",
      price: 0.45,
      images: [
        "https://images.unsplash.com/photo-1588156979435-379b9d802b0a",
        "https://images.unsplash.com/photo-1504274066654-52ff0a49859a",
        "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77"
      ]
    },
    {
      title: "Phone Tripod Stand",
      desc: "Flexible octopus tripod for smartphones and small cameras.",
      price: 1.55,
      images: [
        "https://images.unsplash.com/photo-1516733958055-af09d299026d",
        "https://images.unsplash.com/photo-1622434641406-a158123450f9",
        "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77"
      ]
    },
    {
      title: "Laptop Webcam Cover",
      desc: "Ultra-thin 3-pack webcam sliders for privacy protection.",
      price: 0.25,
      images: [
        "https://images.unsplash.com/photo-1585338107529-13afc5f02586",
        "https://images.unsplash.com/photo-1614332287897-cdc485fa562d",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
      ]
    },
    {
      title: "Bluetooth Finder Tag",
      desc: "Smart tracker for keys and wallets. Connects via mobile app.",
      price: 2.10,
      images: [
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55",
        "https://images.unsplash.com/photo-1586033779166-4828f4851cd9",
        "https://images.unsplash.com/photo-1555538995-7354a13f7331"
      ]
    },
    {
      title: "USB LED Strip (2M)",
      desc: "Backlight for TVs and monitors. Controlled via remote.",
      price: 2.99,
      images: [
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03",
        "https://images.unsplash.com/photo-1563127391-f75de7c1e8d4",
        "https://images.unsplash.com/photo-1520691528527-1f5944bcc353"
      ]
    },
    {
      title: "Ergonomic Wrist Rest",
      desc: "Memory foam wrist support for keyboard and mouse usage.",
      price: 1.80,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        "https://images.unsplash.com/photo-1591488320449-011701bb6704",
        "https://images.unsplash.com/photo-1547082299-de196ea013d6"
      ]
    },
    {
      title: "Metal Phone Stand",
      desc: "Adjustable aluminum desktop stand for iPhone and Android.",
      price: 1.15,
      images: [
        "https://images.unsplash.com/photo-1586105251261-72a756654ff1",
        "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37",
        "https://images.unsplash.com/photo-1555538995-7354a13f7331"
      ]
    }
  ];

  for (let i = 0; i < gadgets.length; i++) {
    const gadget = gadgets[i];
    const sellerUsername = `gadget_pro_${i + 1}`;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // All expire in 3 days

    await prisma.auctions.create({
      data: {
        title: gadget.title,
        description: gadget.desc,
        currentBid: gadget.price,
        seller_id: sellerUsername,
        status: "OPEN",
        expires_at: expiresAt,
        images: {
          create: gadget.images.map(url => ({ url }))
        }
      }
    });
  }

  console.log('✅ 10 Budget Tech Auctions Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });