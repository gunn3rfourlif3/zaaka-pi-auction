import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function showLeaderboard() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const topPioneers = await prisma.users.findMany({
      orderBy: {
        zaaka_trust_score: 'desc'
      },
      take: 5,
      select: {
        username: true,
        zaaka_trust_score: true,
        kyc_status: true
      }
    });

    console.log("\n🏆 --- ZAAKA TRUST LEADERBOARD --- 🏆");
    console.log("Rank | Username          | Score | KYC");
    console.log("---------------------------------------");

    topPioneers.forEach((user, index) => {
      const rank = index + 1;
      const kyc = user.kyc_status ? "✅" : "❌";
      // Simple padding for clean columns
      const name = user.username.padEnd(18);
      console.log(`${rank}    | ${name} | ${user.zaaka_trust_score}   | ${kyc}`);
    });
    console.log("---------------------------------------\n");

  } catch (error) {
    console.error("❌ Leaderboard Error:", error);
  } finally {
    await pool.end();
  }
}

showLeaderboard();