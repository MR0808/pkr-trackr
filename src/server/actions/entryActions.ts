'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';

const createEntrySchema = z.object({
  nightId: z.string().uuid(),
  playerId: z.string().uuid(),
  buyInTotalCents: z.number().int().min(0),
  cashOutTotalCents: z.number().int().min(0),
});

const updateEntrySchema = z.object({
  entryId: z.string().uuid(),
  buyInTotalCents: z.number().int().min(0).optional(),
  cashOutTotalCents: z.number().int().min(0).optional(),
});

const deleteEntrySchema = z.object({
  entryId: z.string().uuid(),
});

export async function createEntry(data: z.infer<typeof createEntrySchema>) {
  const session = await requireAuth();
  const validated = createEntrySchema.parse(data);

  // Check night access and status
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

  if (night.status === 'FINAL') {
    throw new Error('Cannot modify entries in a finalized night');
  }

  // Check if entry already exists for this player/night
  const existing = await prisma.entry.findFirst({
    where: {
      nightId: validated.nightId,
      playerId: validated.playerId,
    },
  });

  if (existing) {
    throw new Error('Entry already exists for this player and night');
  }

  const entry = await prisma.entry.create({
    data: {
      nightId: validated.nightId,
      playerId: validated.playerId,
      buyInTotalCents: validated.buyInTotalCents,
      cashOutTotalCents: validated.cashOutTotalCents,
    },
  });

  return entry;
}

export async function updateEntry(data: z.infer<typeof updateEntrySchema>) {
  const session = await requireAuth();
  const validated = updateEntrySchema.parse(data);

  // Check access
  const entry = await prisma.entry.findUnique({
    where: { id: validated.entryId },
    include: {
      night: {
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
      },
    },
  });

  if (!entry || entry.night.season.league.members.length === 0) {
    throw new Error('Unauthorized or entry not found');
  }

  if (entry.night.status === 'FINAL') {
    throw new Error('Cannot modify entries in a finalized night');
  }

  const updated = await prisma.entry.update({
    where: { id: validated.entryId },
    data: {
      buyInTotalCents: validated.buyInTotalCents,
      cashOutTotalCents: validated.cashOutTotalCents,
    },
  });

  return updated;
}

export async function deleteEntry(data: z.infer<typeof deleteEntrySchema>) {
  const session = await requireAuth();
  const validated = deleteEntrySchema.parse(data);

  // Check access
  const entry = await prisma.entry.findUnique({
    where: { id: validated.entryId },
    include: {
      night: {
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
      },
    },
  });

  if (!entry || entry.night.season.league.members.length === 0) {
    throw new Error('Unauthorized or entry not found');
  }

  if (entry.night.status === 'FINAL') {
    throw new Error('Cannot delete entries in a finalized night');
  }

  await prisma.entry.delete({
    where: { id: validated.entryId },
  });

  return { success: true };
}

