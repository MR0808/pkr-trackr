'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../auth/requireAdmin';

const updateUserAdminSchema = z.object({
  userId: z.string(),
  isAdmin: z.boolean(),
});

const deleteUserSchema = z.object({
  userId: z.string(),
});

const deleteLeagueSchema = z.object({
  leagueId: z.string().uuid(),
});

export async function getAllUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          leagueMembers: true,
          players: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}

export async function getAllLeagues() {
  await requireAdmin();

  const leagues = await prisma.league.findMany({
    include: {
      _count: {
        select: {
          members: true,
          seasons: true,
        },
      },
      members: {
        where: {
          role: 'OWNER',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return leagues;
}

export async function getSystemStats() {
  await requireAdmin();

  const [userCount, leagueCount, seasonCount, nightCount, entryCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.league.count(),
      prisma.season.count(),
      prisma.night.count(),
      prisma.entry.count(),
    ]);

  const totalBuyIn = await prisma.entry.aggregate({
    _sum: {
      buyInTotalCents: true,
    },
  });

  const totalCashOut = await prisma.entry.aggregate({
    _sum: {
      cashOutTotalCents: true,
    },
  });

  return {
    users: userCount,
    leagues: leagueCount,
    seasons: seasonCount,
    nights: nightCount,
    entries: entryCount,
    totalBuyInCents: totalBuyIn._sum.buyInTotalCents || 0,
    totalCashOutCents: totalCashOut._sum.cashOutTotalCents || 0,
  };
}

export async function updateUserAdmin(data: z.infer<typeof updateUserAdminSchema>) {
  await requireAdmin();
  const validated = updateUserAdminSchema.parse(data);

  // Prevent removing admin status from yourself
  const session = await requireAdmin();
  if (validated.userId === session.user.id && !validated.isAdmin) {
    throw new Error('Cannot remove admin status from yourself');
  }

  const updated = await prisma.user.update({
    where: { id: validated.userId },
    data: { isAdmin: validated.isAdmin },
  });

  return updated;
}

export async function deleteUser(data: z.infer<typeof deleteUserSchema>) {
  await requireAdmin();
  const validated = deleteUserSchema.parse(data);

  // Prevent deleting yourself
  const session = await requireAdmin();
  if (validated.userId === session.user.id) {
    throw new Error('Cannot delete your own account');
  }

  await prisma.user.delete({
    where: { id: validated.userId },
  });

  return { success: true };
}

export async function deleteLeague(data: z.infer<typeof deleteLeagueSchema>) {
  await requireAdmin();
  const validated = deleteLeagueSchema.parse(data);

  await prisma.league.delete({
    where: { id: validated.leagueId },
  });

  return { success: true };
}

