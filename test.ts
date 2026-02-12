import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// 👈 Point this to the index file in your new generated folder
import { PrismaClient } from './src/generated/client/client'; 

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("⏳ Connecting to Zaaka PostgreSQL...");
    
    // Using plural 'users' based on your previous DB pull
    const data = await prisma.users.findMany(); 
    
    console.log("✅ SUCCESS! System Online.");
    console.log("Total Users found:", data.length);
  } catch (error) {
    console.error("❌ CONNECTION FAILED:", error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();