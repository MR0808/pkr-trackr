'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';

const createPlayerSchema = z.object({
  name: z.string().min(1).max(100),
  userId: z.string().uuid().optional(),
});

const updatePlayerSchema = z.object({
  playerId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  userId: z.string().uuid().nullable().optional(),
});

const claimPlayerSchema = z.object({
  playerId: z.string().uuid(),
});

export async function createPlayer(data: z.infer<typeof createPlayerSchema>) {
  const session = await requireAuth();
  const validated = createPlayerSchema.parse(data);

  // If userId is provided, verify it matches session or is null (guest player)
  const player = await prisma.player.create({
    data: {
      name: validated.name,
      userId: validated.userId || null,
    },
  });

  return player;
}

export async function updatePlayer(data: z.infer<typeof updatePlayerSchema>) {
  const session = await requireAuth();
  const validated = updatePlayerSchema.parse(data);

  const player = await prisma.player.findUnique({
    where: { id: validated.playerId },
  });

  if (!player) {
    throw new Error('Player not found');
  }

  // If setting userId, verify it matches session
  if (validated.userId !== undefined && validated.userId !== null) {
    if (validated.userId !== session.user.id) {
      throw new Error('Unauthorized: Can only claim players for yourself');
    }
  }

  const updated = await prisma.player.update({
    where: { id: validated.playerId },
    data: {
      name: validated.name,
      userId: validated.userId ?? undefined,
    },
  });

  return updated;
}

export async function claimPlayer(data: z.infer<typeof claimPlayerSchema>) {
  const session = await requireAuth();
  const validated = claimPlayerSchema.parse(data);

  const player = await prisma.player.findUnique({
    where: { id: validated.playerId },
  });

  if (!player) {
    throw new Error('Player not found');
  }

  if (player.userId && player.userId !== session.user.id) {
    throw new Error('Player is already claimed by another user');
  }

  const updated = await prisma.player.update({
    where: { id: validated.playerId },
    data: {
      userId: session.user.id,
    },
  });

  return updated;
}

export async function getPlayers(leagueId: string) {
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

  // Get all players that have entries in this league's seasons
  const seasons = await prisma.season.findMany({
    where: { leagueId },
    select: { id: true },
  });

  const seasonIds = seasons.map((s) => s.id);

  const players = await prisma.player.findMany({
    where: {
      entries: {
        some: {
          night: {
            seasonId: {
              in: seasonIds,
            },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          entries: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return players;
}

