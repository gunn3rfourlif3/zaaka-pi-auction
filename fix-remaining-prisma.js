#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple script to fix Prisma imports
const files = [
  'get_analytics.ts',
  'get_feed.ts',
  'get_history.ts',
  'get_leaderboard.ts',
  'get_summary.ts',
  'get_user_audit.ts',
  'my_biddings.ts',
  'place_bid copy.ts',
  'place_bid.ts',
  'register_user.ts',
  'seed.ts',
  'settle_and_escrow.ts',
  'test.ts',
  'test_full_loop.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the incorrect import
    if (content.includes("./src/generated/client/client")) {
      content = content.replace(
        "import { PrismaClient } from './src/generated/client/client';",
        "import { PrismaClient } from '@prisma/client';"
      );
      
      // Remove pg imports if they exist
      content = content.replace(/import pg from 'pg';\n/g, '');
      content = content.replace(/import { PrismaPg } from '@prisma\/adapter-pg';\n/g, '');
      
      // Fix PrismaClient initialization
      content = content.replace(/const pool = new pg\.Pool\({[^}]+}\);\n/g, '');
      content = content.replace(/const adapter = new PrismaPg\(pool\);\n/g, '');
      content = content.replace(/const prisma = new PrismaClient\({\s*adapter\s*}\);/g, 'const prisma = new PrismaClient();');
      content = content.replace(/const prisma = new PrismaClient\(adapter\);/g, 'const prisma = new PrismaClient();');
      
      // Fix pool.end() calls
      content = content.replace(/await pool\.end\(\);/g, 'await prisma.$disconnect();');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
    }
  }
});

console.log('🎉 All remaining files have been processed!');