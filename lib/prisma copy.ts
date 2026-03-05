import { PrismaClient } from '@prisma/client';

// Simple Prisma client without adapters
const prisma = new PrismaClient();

export default prisma;