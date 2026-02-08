/**
 * Full database backup. Exports all tables to a timestamped JSON file.
 * Use with db:restore to reseed from the backup.
 *
 * Run: npx tsx prisma/backup.ts
 * Or:  npm run db:backup
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
    throw new Error(
        'DATABASE_URL is not set. Add it to .env and ensure PostgreSQL is running.'
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Order matches restore dependency order (parents before children). */
const TABLE_KEYS = [
    'continent',
    'country',
    'region',
    'user',
    'session',
    'account',
    'verification',
    'verificationToken',
    'emailVerificationChallenge',
    'emailChangeRecord',
    'phoneChangeRecord',
    'group',
    'groupMember',
    'player',
    'season',
    'game',
    'gamePlayer',
    'seasonPlayerStats',
    'groupInvite'
] as const;

function serialize(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = serialize(v);
        }
        return out;
    }
    return value;
}

async function main() {
    console.log('📦 Backing up database...');

    const data: Record<string, unknown[]> = {};

    for (const key of TABLE_KEYS) {
        const delegate = (prisma as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[key];
        if (!delegate?.findMany) {
            console.warn(`  Skipping unknown table: ${key}`);
            continue;
        }
        const rows = await delegate.findMany();
        data[key] = serialize(rows) as unknown[];
        console.log(`  ${key}: ${rows.length} rows`);
    }

    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tableOrder: TABLE_KEYS,
        data
    };

    const backupsDir = path.join(process.cwd(), 'prisma', 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    const filepath = path.join(backupsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

    console.log(`\n✅ Backup written to ${filepath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
