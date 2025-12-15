'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';
import { calculateNightPot } from '../metrics/pokerMetrics';

const createNightSchema = z.object({
  seasonId: z.string().uuid(),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

const updateNightSchema = z.object({
  nightId: z.string().uuid(),
  date: z.coerce.date().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(['DRAFT', 'FINAL']).optional(),
});

const finalizeNightSchema = z.object({
  nightId: z.string().uuid(),
});

export async function createNight(data: z.infer<typeof createNightSchema>) {
  const session = await requireAuth();
  const validated = createNightSchema.parse(data);

  // Check season access
  const season = await prisma.season.findUnique({
    where: { id: validated.seasonId },
    include: {
      league: {
        include: {
          members: {
            where: {
              userId: session.user.id,
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  });

  if (!season || season.league.members.length === 0) {
    throw new Error('Unauthorized or season not found');
  }

  const night = await prisma.night.create({
    data: {
      seasonId: validated.seasonId,
      date: validated.date,
      notes: validated.notes,
      status: 'DRAFT',
    },
  });

  return night;
}

export async function updateNight(data: z.infer<typeof updateNightSchema>) {
  const session = await requireAuth();
  const validated = updateNightSchema.parse(data);

  // Check access
  const night = await prisma.night.findUnique({
    where: { id: validated.nightId },
    include: {
      season: {
        include: {
          league: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
      },
    },
  });

  if (!night || night.season.league.members.length === 0) {
    throw new Error('Unauthorized or night not found');
  }

  const updated = await prisma.night.update({
    where: { id: validated.nightId },
    data: {
      date: validated.date,
      notes: validated.notes ?? undefined,
      status: validated.status,
    },
  });

  return updated;
}

export async function finalizeNight(data: z.infer<typeof finalizeNightSchema>) {
  const session = await requireAuth();
  const validated = finalizeNightSchema.parse(data);

  // Check access
  const night = await prisma.night.findUnique({
    where: { id: validated.nightId },
    include: {
      season: {
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
      },
      entries: true,
    },
  });

  if (!night || night.season.league.members.length === 0) {
    throw new Error('Unauthorized or night not found');
  }

  // Validate: sum(buyIns) === sum(cashOuts)
  const totalBuyIn = night.entries.reduce(
    (sum, entry) => sum + entry.buyInTotalCents,
    0
  );
  const totalCashOut = night.entries.reduce(
    (sum, entry) => sum + entry.cashOutTotalCents,
    0
  );

  if (totalBuyIn !== totalCashOut) {
    throw new Error(
      `Cannot finalize: Buy-ins (${totalBuyIn / 100}) do not equal cash-outs (${totalCashOut / 100})`
    );
  }

  if (night.entries.length === 0) {
    throw new Error('Cannot finalize: Night has no entries');
  }

  const updated = await prisma.night.update({
    where: { id: validated.nightId },
    data: {
      status: 'FINAL',
    },
  });

  return updated;
}

export async function getNight(nightId: string) {
  const session = await requireAuth();

  const night = await prisma.night.findUnique({
    where: { id: nightId },
    include: {
      season: {
        include: {
          league: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
      entries: {
        include: {
          player: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!night || night.season.league.members.length === 0) {
    throw new Error('Unauthorized or night not found');
  }

  return night;
}

export async function getNights(seasonId: string) {
  const session = await requireAuth();

  // Check access
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      league: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!season || season.league.members.length === 0) {
    throw new Error('Unauthorized');
  }

  const nights = await prisma.night.findMany({
    where: {
      seasonId,
    },
    include: {
      entries: {
        include: {
          player: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  return nights;
}

