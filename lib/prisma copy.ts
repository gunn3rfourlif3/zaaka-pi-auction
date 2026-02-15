import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const connectionString = `${process.env.DATABASE_URL}`;

// 1. Create a MariaDB pool (compatible with XAMPP MySQL)
const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDb(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 2. Initialize with the MariaDB adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;