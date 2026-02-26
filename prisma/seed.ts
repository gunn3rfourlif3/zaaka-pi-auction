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

  const categoryMap: Record<string, { titles: string[], imageGroups: string[][] }> = {
    'Fashion': {
      titles: ['Vintage Rolex', 'Gucci Slides', 'Supreme Hoodie', 'Prada Bag', 'Yeezy 350', 'Levi 501s', 'RayBan Wayfarer', 'Silk Tie', 'Leather Boots', 'Gold Chain'],
      imageGroups: [
        ['1523275335684-37898b6baf30', '1523175685310-756dc860d704', '1509192823451-d3abb4ad8fa0'],
        ['1560769629-975ec94e6a86', '1603808033176-9d134e6f2c74', '1595950653106-6c9ebd614d3a'],
        ['1556821840-3a63f95609a7', '1578587018452-892bacef3d24', '1554568210-b46e501eb4a8'],
        ['1584917865442-de89df76afd3', '1544816155-12df9643f363', '1591561954557-26941169b79e'],
        ['1514444773931-f0980ca7b74d', '1618354691373-d851c5c6a990', '1600185365926-3a2ce3cdb9eb'],
        ['1542272454315-4c01d7afdf91', '1475178626620-a4d074967452', '1582552938382-7901869e5784'],
        ['1511499767330-a798a3ff5ea3', '1572635196237-14b3f281503f', '1577803645773-f96470509666'],
        ['1598033129183-c4070ab26b03', '1617137934035-5d923247c619', '1589756823851-41910a99616d'],
        ['1542838132-92c53300491e', '1605733513943-98282329610f', '1606103920295-9a091573f160'],
        ['1611591437281-460bf3d67b8d', '1599643477877-530eb8348200', '1602173574717-353118abf52d']
      ]
    },
    'Electronics': {
      titles: ['iPhone 15', 'DJI Drone', 'PS5 Console', 'Mechanical Key', 'Gaming Mouse', 'Curved Monitor', 'VR Headset', 'Smart Watch', 'Bluetooth Mic', 'DSLR Camera'],
      imageGroups: [
        ['1511707171634-5f897ff02aa9', '1592899677977-9c10ca588bbd', '1512941937669-90a1b58e7e9c'],
        ['1473960156066-61398b7a5902', '1508614589041-895b8896755a', '1506947411487-a56741ed7f0c'],
        ['1605901309584-818e2596df06', '1606144045514-ce0091aa9945', '1606841837209-d9ec9a65be8f'],
        ['1511467687858-23d96c32e4ae', '1541140134513-85a161dc4a65', '1595225484199-b025878126c4'],
        ['1615663245862-99157ef3cd36', '1527814050079-1ec61251e8bc', '1527863683018-84a20e613861'],
        ['1527443224202-427aa3f7c9da', '1547119048-ef21fb4af71a', '1551650975-87deedd9d97f'],
        ['1622979135961-d282ed9b4637', '1592478411213-6539344445b2', '1617802690911-753051406856'],
        ['1508685096489-7aacd43bd3b1', '1523275335684-37898b6baf30', '1544244015-0df4b3ffc6b0'],
        ['1590602847444-45b451722824', '1590602846933-776461f3693c', '1459933389269-939e1050e32b'],
        ['1516035069371-29a1b244cc32', '1510127034890-ade27508605e', '1502920917128-1aa500764cbd']
      ]
    },
    'Collectibles': {
      titles: ['Charizard Card', 'Star Wars Toy', 'Comic Issue #1', 'Vinyl Record', 'Stamp Set', 'Antique Coin', 'Action Figure', 'Signed Poster', 'Model Train', 'Vintage Clock'],
      imageGroups: [
        ['1611641613359-f698d544653d', '1611641613359-f698d544653d', '1611641613359-f698d544653d'],
        ['1598510114028-19747768560a', '1598510114028-19747768560a', '1598510114028-19747768560a'],
        ['1601645191163-3fc0d5d64e35', '1601645191163-3fc0d5d64e35', '1601645191163-3fc0d5d64e35'],
        ['1603048588665-791ca8aea617', '1603048588665-791ca8aea617', '1603048588665-791ca8aea617'],
        ['1559106033-662973163330', '1559106033-662973163330', '1559106033-662973163330'],
        ['1589756823851-41910a99616d', '1589756823851-41910a99616d', '1589756823851-41910a99616d'],
        ['1558060370-d641707b5589', '1558060370-d641707b5589', '1558060370-d641707b5589'],
        ['1594732832279-05240294e073', '1594732832279-05240294e073', '1594732832279-05240294e073'],
        ['1474015977022-44b21c821c18', '1474015977022-44b21c821c18', '1474015977022-44b21c821c18'],
        ['1508685096489-7aacd43bd3b1', '1508685096489-7aacd43bd3b1', '1508685096489-7aacd43bd3b1']
      ]
    }
  };

  const categoryNames = Object.keys(categoryMap);

  console.log('Seeding 30 Unique Items with short durations and low prices...');
  for (let i = 0; i < 30; i++) {
    const category = categoryNames[i % categoryNames.length];
    const data = categoryMap[category];
    const itemIdx = Math.floor(i / categoryNames.length) % 10;
    const title = data.titles[itemIdx];
    const images = data.imageGroups[itemIdx];

    // Under 5 Pi: random between 0.5 and 4.9
    const startPrice = (Math.random() * 4.4 + 0.5).toFixed(2);
    
    // Under 30 mins: random between 5 and 25 minutes
    const expiryMinutes = Math.floor(Math.random() * 20) + 5;
    const expiresAt = new Date(Date.now() + 1000 * 60 * expiryMinutes);

    await prisma.auctions.create({
      data: {
        title: `${title} #${i + 1}`,
        description: `Flash Auction! High-quality ${title} from our ${category} collection. Ending soon!`,
        category: category,
        currentBid: startPrice,
        seller_id: `pioneer_${200 + i}`,
        status: 'OPEN',
        expires_at: expiresAt,
        images: {
          create: images.map(id => ({
            url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`
          }))
        }
      }
    });
  }

  console.log('✅ Success! 30 items seeded with 3 images each, under 5 Pi, and <30 min expiry.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
