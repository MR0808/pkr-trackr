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

    await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: 'kram@grebnesor.com',
                name: 'Mark Rosenberg',
                firstName: 'Mark',
                lastName: 'Rosenberg'
            }
        });

        const group = await tx.group.create({
            data: {
                name: 'The Tudor Crew',
                slug: 'tudor-crew',
                ownerId: user.id
            }
        });

        await tx.groupMember.create({
            data: {
                groupId: group.id,
                userId: user.id,
                role: 'OWNER'
            }
        });

        await tx.season.create({
            data: {
                groupId: group.id,
                name: '2025',
                startsAt: fromZonedTime('2025-01-01T00:00:00', MEL_TZ),
                endsAt: fromZonedTime('2025-12-31T23:59:59', MEL_TZ)
            }
        });

        await tx.season.create({
            data: {
                groupId: group.id,
                name: '2024',
                startsAt: fromZonedTime('2024-01-01T00:00:00', MEL_TZ),
                endsAt: fromZonedTime('2024-12-31T23:59:59', MEL_TZ)
            }
        });

        await tx.season.create({
            data: {
                groupId: group.id,
                name: '2023',
                startsAt: fromZonedTime('2023-01-01T00:00:00', MEL_TZ),
                endsAt: fromZonedTime('2023-12-31T23:59:59', MEL_TZ)
            }
        });

        await tx.season.create({
            data: {
                groupId: group.id,
                name: '2022',
                startsAt: fromZonedTime('2022-01-01T00:00:00', MEL_TZ),
                endsAt: fromZonedTime('2022-12-31T23:59:59', MEL_TZ)
            }
        });

        const season = await tx.season.create({
            data: {
                groupId: group.id,
                name: '2026',
                startsAt: new Date('2026-01-01')
            }
        });

        // ----------------------------
        // Create host player (linked to user)
        // ----------------------------
        const hostPlayer = await tx.player.create({
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
        const guestNames = ['Cam', 'Dave L', 'Jack', 'Frank', 'Julia', 'James T'];
        const guestPlayers = [];
        for (const name of guestNames) {
            const p = await tx.player.create({
                data: {
                    groupId: group.id,
                    name
                }
            });
            guestPlayers.push(p);
        }

        // ----------------------------
        // Create 10 closed games (so Stats shows "last 10 nights")
        // ----------------------------
        const allPlayers = [hostPlayer, ...guestPlayers];
        const nightCount = 10;
        for (let i = 0; i < nightCount; i++) {
            const nightDate = new Date('2026-01-25');
            nightDate.setDate(nightDate.getDate() + i);
            const scheduledAt = fromZonedTime(
                `${nightDate.getFullYear()}-${String(nightDate.getMonth() + 1).padStart(2, '0')}-${String(nightDate.getDate()).padStart(2, '0')}T19:30`,
                MEL_TZ
            );
            const game = await tx.game.create({
                data: {
                    groupId: group.id,
                    seasonId: season.id,
                    name: `Night ${i + 1} – ${scheduledAt.toISOString().slice(0, 10)}`,
                    shareId: nanoid(16),
                    scheduledAt,
                    status: 'CLOSED',
                    closedAt: scheduledAt
                }
            });
            for (const p of allPlayers) {
                await tx.gamePlayer.create({
                    data: {
                        gameId: game.id,
                        playerId: p.id
                    }
                });
            }
        }
    });

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
