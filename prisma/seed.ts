import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { nanoid } from 'nanoid';
import { fromZonedTime } from 'date-fns-tz';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
    throw new Error(
        'DATABASE_URL is not set. Add it to .env and ensure PostgreSQL is running.'
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const MEL_TZ = 'Australia/Melbourne';

async function main() {
    console.log('🌱 Clearing existing data...');

    await prisma.groupInvite.deleteMany();
    await prisma.seasonPlayerStats.deleteMany();
    await prisma.gamePlayer.deleteMany();
    await prisma.game.deleteMany();
    await prisma.season.deleteMany();
    await prisma.player.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleared');

    const user = await prisma.user.create({
        data: {
            email: 'kram@grebnesor.com',
            name: 'Mark Rosenberg',
            firstName: 'Mark',
            lastName: 'Rosenberg'
        }
    });

    const group = await prisma.group.create({
        data: {
            name: 'The Tudor Crew',
            slug: 'tudor-crew',
            ownerId: user.id
        }
    });

    await prisma.groupMember.create({
        data: {
            groupId: group.id,
            userId: user.id,
            role: 'OWNER'
        }
    });

    const season = await prisma.season.create({
        data: {
            groupId: group.id,
            name: '2026 Season',
            startsAt: new Date('2026-01-01')
        }
    });

    // ----------------------------
    // Create host player (linked to user)
    // ----------------------------
    const hostPlayer = await prisma.player.create({
        data: {
            groupId: group.id,
            name: 'Mark',
            email: user.email,
            userId: user.id
        }
    });

    // ----------------------------
    // Create guest players
    // ----------------------------

    const guestNames = ['Cam', 'Dave L', 'Jack', 'Frank'];

    const guestPlayers = [];
    for (const name of guestNames) {
        const p = await prisma.player.create({
            data: {
                groupId: group.id,
                name
            }
        });
        guestPlayers.push(p);
    }

    // ----------------------------
    // Create game (Saturday night)
    // ----------------------------

    const scheduledAt = fromZonedTime('2026-02-07T19:30', MEL_TZ); // 7:30pm Melbourne

    const game = await prisma.game.create({
        data: {
            groupId: group.id,
            seasonId: season.id,
            name: 'Saturday Night 7th Feb',
            shareId: nanoid(16),
            scheduledAt
        }
    });

    // ----------------------------
    // Add ALL players (including host) to game
    // ----------------------------
    const allPlayers = [hostPlayer, ...guestPlayers];

    for (const p of allPlayers) {
        await prisma.gamePlayer.create({
            data: {
                gameId: game.id,
                playerId: p.id
            }
        });
    }

    console.log('✅ Seed complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
