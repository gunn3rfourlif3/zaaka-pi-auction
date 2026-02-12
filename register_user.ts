import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/client/client';

async function registerUser(uid: string, username: string) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`📡 Registering Pioneer: ${username}...`);

    const user = await prisma.users.upsert({
      where: { uid: uid },
      update: {
        username: username, // Update username if it changed in the Pi App
      },
      create: {
        uid: uid,
        username: username,
        kyc_status: false,       // New users start unverified
        zaaka_trust_score: 100,  // New users start with a clean score
      },
    });

    console.log(`✅ User Registered Successfully!`);
    console.log(`🆔 UID: ${user.uid}`);
    console.log(`⭐ Trust Score: ${user.zaaka_trust_score}`);

  } catch (error: any) {
    console.error(`❌ REGISTRATION FAILED: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// --- TEST: Register a new Pioneer ---
// In a real app, these values come from the Pi Network Sandbox/SDK
registerUser('pi_user_999_test', 'Pioneer_Z');