import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function showLeaderboard() {
  const prisma = new PrismaClient();

  try {
    // Note: users model not available in current schema
    console.log("❌ Leaderboard feature requires users model with zaaka_trust_score field");
    return;
    
    // This would be the code if users model existed:
    // const topPioneers = await prisma.users.findMany({
    //   orderBy: {
    //     zaaka_trust_score: 'desc'
    //   },
    //   take: 5,
    //   select: {
    //     username: true,
    //     zaaka_trust_score: true,
    //     kyc_status: true
    //   }
    // });

    console.log("\n🏆 --- ZAAKA TRUST LEADERBOARD --- 🏆");
    console.log("Feature requires users model with zaaka_trust_score field");
    console.log("---------------------------------------");

  } catch (error) {
    console.error("❌ Leaderboard Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

showLeaderboard();