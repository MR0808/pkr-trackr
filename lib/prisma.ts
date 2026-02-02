import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
    throw new Error(
        'DATABASE_URL is not set. Add it to .env (e.g. DATABASE_URL="postgresql://user:pass@localhost:5432/dbname") and ensure PostgreSQL is running.'
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
