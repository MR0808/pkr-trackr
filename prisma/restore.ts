/**
 * Restore database from a backup file (created by prisma/backup.ts).
 * Clears existing data then re-inserts in dependency order.
 *
 * Run: npx tsx prisma/restore.ts [path-to-backup.json]
 *      If no path given, uses the latest backup in prisma/backups/
 * Or:  npm run db:restore
 *      npm run db:restore -- prisma/backups/backup-2025-02-02T12-00-00.json
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

type Backup = {
    version: number;
    exportedAt: string;
    tableOrder: readonly string[];
    data: Record<string, unknown[]>;
};

function parseDateFields(obj: Record<string, unknown>, dateKeys: string[]): Record<string, unknown> {
    const out = { ...obj };
    for (const k of dateKeys) {
        if (k in out && typeof out[k] === 'string') {
            out[k] = new Date(out[k] as string);
        }
    }
    return out;
}

const DATE_KEYS_BY_TABLE: Record<string, string[]> = {
    user: ['createdAt', 'updatedAt', 'emailVerifiedAt', 'dateOfBirth'],
    session: ['expiresAt', 'createdAt', 'updatedAt'],
    account: ['accessTokenExpiresAt', 'refreshTokenExpiresAt', 'createdAt', 'updatedAt'],
    verification: ['expiresAt', 'createdAt', 'updatedAt'],
    verificationToken: ['expires'],
    emailVerificationChallenge: ['magicExpiresAt', 'otpExpiresAt', 'lastSentAt', 'usedAt', 'revokedAt', 'createdAt'],
    emailChangeRecord: ['expiresAt', 'createdAt'],
    phoneChangeRecord: ['expiresAt', 'createdAt'],
    country: ['createdAt', 'updatedAt'],
    region: ['createdAt', 'updatedAt'],
    group: ['createdAt', 'updatedAt'],
    groupMember: ['createdAt'],
    player: ['createdAt', 'updatedAt'],
    season: ['createdAt', 'startsAt', 'endsAt'],
    game: ['scheduledAt', 'startedAt', 'closedAt', 'createdAt'],
    gamePlayer: ['createdAt', 'updatedAt'],
    seasonPlayerStats: ['updatedAt'],
    groupInvite: ['createdAt', 'sentAt', 'expiresAt', 'acceptedAt', 'revokedAt']
};

const REVERSE_ORDER = [
    'groupInvite', 'seasonPlayerStats', 'gamePlayer', 'game', 'season', 'player',
    'groupMember', 'group', 'phoneChangeRecord', 'emailChangeRecord', 'emailVerificationChallenge',
    'verificationToken', 'verification', 'account', 'session', 'user',
    'region', 'country', 'continent'
];

async function clearAll() {
    console.log('🗑️  Clearing existing data...');
    for (const key of REVERSE_ORDER) {
        const delegate = (prisma as unknown as Record<string, { deleteMany: () => Promise<unknown> }>)[key];
        if (delegate?.deleteMany) {
            await delegate.deleteMany();
            console.log(`  Cleared ${key}`);
        }
    }
}

async function restore(backup: Backup) {
    const order = [...backup.tableOrder];
    for (const key of order) {
        const rows = backup.data[key];
        if (!rows || rows.length === 0) continue;

        const delegate = (prisma as unknown as Record<string, { createMany: (args: { data: unknown[]; skipDuplicates?: boolean }) => Promise<{ count: number }> }>)[key];
        if (!delegate?.createMany) {
            console.warn(`  Skip (no createMany): ${key}`);
            continue;
        }

        const dateKeys = DATE_KEYS_BY_TABLE[key] ?? [];
        const data = rows.map((row) => parseDateFields(row as Record<string, unknown>, dateKeys));

        const { count } = await delegate.createMany({ data, skipDuplicates: true });
        console.log(`  ${key}: ${count} rows`);
    }
}

async function main() {
    let filepath = process.argv[2];
    if (!filepath) {
        const backupsDir = path.join(process.cwd(), 'prisma', 'backups');
        if (!fs.existsSync(backupsDir)) {
            throw new Error('No backup path given and prisma/backups/ not found. Run: npx tsx prisma/restore.ts path/to/backup.json');
        }
        const files = fs.readdirSync(backupsDir)
            .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
            .sort()
            .reverse();
        if (files.length === 0) {
            throw new Error('No backup files in prisma/backups/. Run prisma/backup.ts first.');
        }
        filepath = path.join(backupsDir, files[0]);
        console.log(`Using latest backup: ${filepath}`);
    }
    if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filepath}`);
    }

    const raw = fs.readFileSync(filepath, 'utf-8');
    const backup = JSON.parse(raw) as Backup;
    if (!backup.data || !backup.tableOrder) {
        throw new Error('Invalid backup format: missing data or tableOrder');
    }

    console.log(`\n📥 Restoring from ${path.basename(filepath)} (exported ${backup.exportedAt})...\n`);
    await clearAll();
    console.log('');
    await restore(backup);
    console.log('\n✅ Restore complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
