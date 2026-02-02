'use server';

import { prisma } from '@/lib/prisma';

export type GameListRow = {
    id: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    scheduledAt: Date;
    startedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;

    playerCount: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    deltaCents: number; // buyins - cashouts
};

export async function loadGamesForGroup(opts: {
    groupId: string;
    seasonId?: string;
    status?: 'OPEN' | 'CLOSED';
    take?: number;
    skip?: number;
}): Promise<GameListRow[]> {
    const { groupId, seasonId, status, take = 50, skip = 0 } = opts;

    if (!groupId) throw new Error('groupId is required');

    // 1) Fetch games (display fields + ordering)
    const games = await prisma.game.findMany({
        where: {
            groupId,
            ...(seasonId ? { seasonId } : {}),
            ...(status ? { status } : {})
        },
        orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        select: {
            id: true,
            name: true,
            status: true,
            scheduledAt: true,
            startedAt: true,
            closedAt: true,
            createdAt: true
        }
    });

    if (games.length === 0) return [];

    const gameIds = games.map((g) => g.id);

    // 2) Aggregate GamePlayer per game
    const aggregates = await prisma.gamePlayer.groupBy({
        by: ['gameId'],
        where: { gameId: { in: gameIds } },
        _count: { _all: true },
        _sum: {
            buyInCents: true,
            cashOutCents: true
        }
    });

    // Map: gameId -> aggregates
    const aggByGameId = new Map<
        string,
        {
            playerCount: number;
            totalBuyInCents: number;
            totalCashOutCents: number;
        }
    >();

    for (const a of aggregates) {
        aggByGameId.set(a.gameId, {
            playerCount: a._count._all ?? 0,
            totalBuyInCents: a._sum.buyInCents ?? 0,
            // Prisma sums ignore null; if all cashOutCents are null, _sum.cashOutCents will be null
            totalCashOutCents: a._sum.cashOutCents ?? 0
        });
    }

    // 3) Merge + compute delta
    return games.map((g) => {
        const agg = aggByGameId.get(g.id) ?? {
            playerCount: 0,
            totalBuyInCents: 0,
            totalCashOutCents: 0
        };

        const deltaCents = agg.totalBuyInCents - agg.totalCashOutCents;

        return {
            id: g.id,
            name: g.name,
            status: g.status,
            scheduledAt: g.scheduledAt,
            startedAt: g.startedAt,
            closedAt: g.closedAt,
            createdAt: g.createdAt,

            playerCount: agg.playerCount,
            totalBuyInCents: agg.totalBuyInCents,
            totalCashOutCents: agg.totalCashOutCents,
            deltaCents
        };
    });
}
