'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';

const createSeasonSchema = z.object({
  leagueId: z.string().uuid(),
  name: z.string().min(1).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

const updateSeasonSchema = z.object({
  seasonId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function createSeason(data: z.infer<typeof createSeasonSchema>) {
  const session = await requireAuth();
  const validated = createSeasonSchema.parse(data);

  // Check league access
  const member = await prisma.leagueMember.findFirst({
    where: {
      leagueId: validated.leagueId,
      userId: session.user.id,
      status: 'ACTIVE',
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!member) {
    throw new Error('Unauthorized: Only owners and admins can create seasons');
  }

  // Deactivate other active seasons in the league
  await prisma.season.updateMany({
    where: {
      leagueId: validated.leagueId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  const season = await prisma.season.create({
    data: {
      leagueId: validated.leagueId,
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate,
      isActive: true,
    },
  });

  return season;
}

export async function updateSeason(data: z.infer<typeof updateSeasonSchema>) {
  const session = await requireAuth();
  const validated = updateSeasonSchema.parse(data);

  // Check league access
  const season = await prisma.season.findUnique({
    where: { id: validated.seasonId },
    include: {
      league: {
        include: {
          members: {
            where: {
              userId: session.user.id,
              status: 'ACTIVE',
              role: {
                in: ['OWNER', 'ADMIN'],
              },
            },
          },
        },
      },
    },
  });

  if (!season || season.league.members.length === 0) {
    throw new Error('Unauthorized or season not found');
  }

  const updated = await prisma.season.update({
    where: { id: validated.seasonId },
    data: {
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate ?? undefined,
      isActive: validated.isActive,
    },
  });

  return updated;
}

export async function getSeasons(leagueId: string) {
  const session = await requireAuth();

  // Check league access
  const member = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw new Error('Unauthorized');
  }

  const seasons = await prisma.season.findMany({
    where: {
      leagueId,
    },
    include: {
      nights: {
        orderBy: {
          date: 'desc',
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  return seasons;
}

