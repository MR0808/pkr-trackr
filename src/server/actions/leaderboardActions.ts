'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';
import { calculateSeasonMetrics } from '../metrics/pokerMetrics';

const getLeaderboardSchema = z.object({
  leagueId: z.string().uuid(),
  seasonId: z.string().uuid().optional(),
  type: z.enum([
    'best-player',
    'top-winner',
    'best-performer',
    'most-action',
    'best-night',
    'biggest-table-take',
  ]),
  minNights: z.number().int().min(0).default(3), // Eligibility threshold
});

export async function getLeaderboard(
  data: z.infer<typeof getLeaderboardSchema>
) {
  const session = await requireAuth();
  const validated = getLeaderboardSchema.parse(data);

  // Check league access
  const member = await prisma.leagueMember.findFirst({
    where: {
      leagueId: validated.leagueId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw new Error('Unauthorized');
  }

  // Get active season or specified season
  let seasonId = validated.seasonId;
  if (!seasonId) {
    const activeSeason = await prisma.season.findFirst({
      where: {
        leagueId: validated.leagueId,
        isActive: true,
      },
    });
    if (!activeSeason) {
      return [];
    }
    seasonId = activeSeason.id;
  }

  // Get all nights in season
  const nights = await prisma.night.findMany({
    where: {
      seasonId,
      status: 'FINAL', // Only count finalized nights
    },
    include: {
      entries: {
        include: {
          player: true,
        },
      },
    },
  });

  // Group entries by player
  const playerMap = new Map<
    string,
    {
      player: { id: string; name: string; userId: string | null };
      entries: Array<{
        id: string;
        nightId: string;
        buyInTotalCents: number;
        cashOutTotalCents: number;
        night: {
          id: string;
          status: string;
          entries: Array<{ buyInTotalCents: number }>;
        };
      }>;
    }
  >();

  for (const night of nights) {
    for (const entry of night.entries) {
      const playerId = entry.playerId;
      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          player: entry.player,
          entries: [],
        });
      }
      const playerData = playerMap.get(playerId)!;
      playerData.entries.push({
        id: entry.id,
        nightId: entry.nightId,
        buyInTotalCents: entry.buyInTotalCents,
        cashOutTotalCents: entry.cashOutTotalCents,
        night: {
          id: night.id,
          status: night.status,
          entries: night.entries.map((e) => ({
            buyInTotalCents: e.buyInTotalCents,
          })),
        },
      });
    }
  }

  // Calculate metrics for each player
  const leaderboard = Array.from(playerMap.values())
    .map(({ player, entries }) => {
      const metrics = calculateSeasonMetrics(entries);
      return {
        playerId: player.id,
        playerName: player.name,
        userId: player.userId,
        ...metrics,
      };
    })
    .filter((item) => item.nightsPlayed >= validated.minNights);

  // Sort based on leaderboard type
  switch (validated.type) {
    case 'best-player':
      return leaderboard.sort((a, b) => b.seasonROI - a.seasonROI);
    case 'top-winner':
      return leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
    case 'best-performer':
      return leaderboard.sort((a, b) => b.seasonScore - a.seasonScore);
    case 'most-action':
      return leaderboard.sort((a, b) => b.totalBuyIn - a.totalBuyIn);
    case 'biggest-table-take':
      return leaderboard.sort((a, b) => b.bestTableShare - a.bestTableShare);
    case 'best-night':
      return leaderboard.sort((a, b) => {
        const aScore = a.bestSingleNight?.score ?? 0;
        const bScore = b.bestSingleNight?.score ?? 0;
        return bScore - aScore;
      });
    default:
      return leaderboard;
  }
}

