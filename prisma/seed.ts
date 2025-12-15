import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pkr-trackr.com' },
    update: {},
    create: {
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@pkr-trackr.com',
      emailVerified: true,
    },
  });

  // Create demo league
  const demoLeague = await prisma.league.create({
    data: {
      name: 'Demo Poker League',
      description: 'A sample league for testing and demonstration',
      members: {
        create: {
          userId: demoUser.id,
          email: demoUser.email,
          status: 'ACTIVE',
          role: 'OWNER',
          joinedAt: new Date(),
        },
      },
    },
  });

  // Create guest players
  const players = await Promise.all([
    prisma.player.create({
      data: { name: 'Alice' },
    }),
    prisma.player.create({
      data: { name: 'Bob' },
    }),
    prisma.player.create({
      data: { name: 'Charlie', userId: demoUser.id },
    }),
    prisma.player.create({
      data: { name: 'Diana' },
    }),
    prisma.player.create({
      data: { name: 'Eve' },
    }),
    prisma.player.create({
      data: { name: 'Frank' },
    }),
  ]);

  // Create active season
  const season = await prisma.season.create({
    data: {
      leagueId: demoLeague.id,
      name: 'Winter 2024',
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
  });

  // Create 6 sample nights
  const nights = await Promise.all([
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-01-15'),
        status: 'FINAL',
        notes: 'First night of the season',
      },
    }),
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-01-22'),
        status: 'FINAL',
        notes: 'High stakes night',
      },
    }),
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-01-29'),
        status: 'FINAL',
      },
    }),
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-02-05'),
        status: 'FINAL',
      },
    }),
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-02-12'),
        status: 'FINAL',
      },
    }),
    prisma.night.create({
      data: {
        seasonId: season.id,
        date: new Date('2024-02-19'),
        status: 'DRAFT',
        notes: 'Current week - not finalized',
      },
    }),
  ]);

  // Create entries for each night with mixed buy-ins
  // Night 1: 5 players, $20 buy-in
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[0].id,
        playerId: players[0].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 3500, // +$15
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[0].id,
        playerId: players[1].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 2500, // +$5
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[0].id,
        playerId: players[2].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 1500, // -$5
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[0].id,
        playerId: players[3].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 1000, // -$10
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[0].id,
        playerId: players[4].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 500, // -$15
      },
    }),
  ]);

  // Night 2: 6 players, $25 buy-in
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[0].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 0, // -$25
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[1].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 5000, // +$25
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[2].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 3750, // +$12.50
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[3].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 2500, // $0
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[4].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 1250, // -$12.50
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[1].id,
        playerId: players[5].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 0, // -$25
      },
    }),
  ]);

  // Night 3: 4 players, $30 buy-in
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[2].id,
        playerId: players[0].id,
        buyInTotalCents: 3000,
        cashOutTotalCents: 6000, // +$30
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[2].id,
        playerId: players[1].id,
        buyInTotalCents: 3000,
        cashOutTotalCents: 3000, // $0
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[2].id,
        playerId: players[2].id,
        buyInTotalCents: 3000,
        cashOutTotalCents: 0, // -$30
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[2].id,
        playerId: players[3].id,
        buyInTotalCents: 3000,
        cashOutTotalCents: 0, // -$30
      },
    }),
  ]);

  // Night 4: 5 players, $20 buy-in
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[3].id,
        playerId: players[1].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 5000, // +$30
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[3].id,
        playerId: players[2].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 2000, // $0
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[3].id,
        playerId: players[3].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 1000, // -$10
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[3].id,
        playerId: players[4].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 0, // -$20
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[3].id,
        playerId: players[5].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 0, // -$20
      },
    }),
  ]);

  // Night 5: 6 players, $25 buy-in
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[0].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 3750, // +$12.50
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[1].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 5000, // +$25
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[2].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 2500, // $0
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[3].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 1250, // -$12.50
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[4].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 0, // -$25
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[4].id,
        playerId: players[5].id,
        buyInTotalCents: 2500,
        cashOutTotalCents: 0, // -$25
      },
    }),
  ]);

  // Night 6: Draft night with 4 players
  await Promise.all([
    prisma.entry.create({
      data: {
        nightId: nights[5].id,
        playerId: players[0].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 3000, // +$10 (draft, can be modified)
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[5].id,
        playerId: players[1].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 2000, // $0
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[5].id,
        playerId: players[2].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 1000, // -$10
      },
    }),
    prisma.entry.create({
      data: {
        nightId: nights[5].id,
        playerId: players[3].id,
        buyInTotalCents: 2000,
        cashOutTotalCents: 2000, // $0
      },
    }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log(`   - Created demo user: ${demoUser.email}`);
  console.log(`   - Created league: ${demoLeague.name}`);
  console.log(`   - Created ${players.length} players`);
  console.log(`   - Created season: ${season.name}`);
  console.log(`   - Created ${nights.length} nights`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

