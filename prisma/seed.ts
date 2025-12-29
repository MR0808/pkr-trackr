import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { hashPassword } from '../lib/argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create demo user with password
  const demoPassword = 'demo123';
  const hashedPassword = await hashPassword(demoPassword);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pkr-trackr.com' },
    update: {
      isAdmin: true, // Ensure demo user is always an admin
      name: 'Demo User', // Better Auth requires name
      firstName: 'Demo',
      lastName: 'User',
    },
    create: {
      id: 'demo-user-1',
      name: 'Demo User', // Better Auth requires name
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@pkr-trackr.com',
      emailVerified: true,
      isAdmin: true, // Make demo user an admin
    },
  });

  // Create account with password for Better Auth
  // Check if account already exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: demoUser.id,
      providerId: 'credential',
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        id: `account-${demoUser.id}`,
        accountId: demoUser.email,
        providerId: 'credential',
        userId: demoUser.id,
        password: hashedPassword,
      },
    });
  } else {
    // Update password if account exists
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  }

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
      data: { displayName: 'Alice' },
    }),
    prisma.player.create({
      data: { displayName: 'Bob' },
    }),
    prisma.player.create({
      data: { displayName: 'Charlie', userId: demoUser.id },
    }),
    prisma.player.create({
      data: { displayName: 'Diana' },
    }),
    prisma.player.create({
      data: { displayName: 'Eve' },
    }),
    prisma.player.create({
      data: { displayName: 'Frank' },
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
  console.log(`   - Password: ${demoPassword}`);
  console.log(`   - Admin: ${demoUser.isAdmin ? 'Yes' : 'No'}`);
  console.log(`   - Created league: ${demoLeague.name}`);
  console.log(`   - Created ${players.length} players`);
  console.log(`   - Created season: ${season.name}`);
  console.log(`   - Created ${nights.length} nights`);
  console.log('\n📝 Login credentials:');
  console.log(`   Email: ${demoUser.email}`);
  console.log(`   Password: ${demoPassword}`);
  console.log(`   Admin Access: Yes (can access /admin dashboard)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

