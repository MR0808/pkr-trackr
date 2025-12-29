import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

// Prevent multiple instances of Prisma Client in development
// This is critical for Next.js hot reloading to avoid connection pool exhaustion
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaPg | undefined;
};

const adapter =
  globalForPrisma.adapter ??
  new PrismaPg({ connectionString });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.adapter = adapter;
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export { prisma };
