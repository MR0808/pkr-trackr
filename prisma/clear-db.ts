import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
    throw new Error(
        'DATABASE_URL is not set. Add it to .env and ensure PostgreSQL is running.'
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function clear() {
    console.log('💣 Clearing ALL data...');

    await prisma.groupInvite.deleteMany();
    await prisma.seasonPlayerStats.deleteMany();
    await prisma.gamePlayer.deleteMany();
    await prisma.game.deleteMany();
    await prisma.season.deleteMany();
    await prisma.player.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database fully cleared');
}

clear()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
