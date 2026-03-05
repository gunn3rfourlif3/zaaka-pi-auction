#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need fixing
const filesToFix = [
  'confirm_delivery.ts',
  'test_full_loop.ts',
  'settle_and_escrow.ts',
  'place_bid.ts',
  'get_leaderboard.ts',
  'get_summary.ts',
  'seed.ts',
  'get_user_audit.ts',
  'get_analytics.ts',
  'my_biddings.ts',
  'register_user.ts',
  'get_feed.ts',
  'get_history.ts',
  'create_auction.ts',
  'place_bid copy.ts',
  'test.ts'
];

const oldImport = "import { PrismaClient } from './src/generated/client/client';";
const newImport = "import { PrismaClient } from '@prisma/client';";

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      
      // Also remove pg imports if they exist
      content = content.replace(/import pg from 'pg';\n/g, '');
      content = content.replace(/import { PrismaPg } from '@prisma\/adapter-pg';\n/g, '');
      
      // Fix PrismaClient initialization
      content = content.replace(/const pool = new pg\.Pool\({ connectionString: process\.env\.DATABASE_URL \});\n/g, '');
      content = content.replace(/const adapter = new PrismaPg\(pool\);\n/g, '');
      content = content.replace(/const prisma = new PrismaClient\({ adapter }\);/g, 'const prisma = new PrismaClient();');
      content = content.replace(/const prisma = new PrismaClient\(adapter\);/g, 'const prisma = new PrismaClient();');
      
      // Fix pool.end() calls
      content = content.replace(/await pool\.end\(\);/g, 'await prisma.$disconnect();');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
    } else {
      console.log(`⚠️  No changes needed for ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('🎉 All files have been processed!');