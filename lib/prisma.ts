import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
        throw new Error(
            'DATABASE_URL is not set. Add it to .env (e.g. DATABASE_URL="postgresql://user:pass@localhost:5432/dbname") and ensure PostgreSQL is running.'
        );
    }

    // Supabase session-mode pooler (port 5432) caps clients at Pool Size (often 15).
    // Cap the local pg pool and reuse one client across Next.js HMR so we don't
    // open a new default-sized pool on every module reload.
    const pool =
        globalForPrisma.pgPool ??
        new Pool({
            connectionString,
            max: 3,
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 10_000,
        });

    globalForPrisma.pgPool = pool;

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
