'use server';

import { prisma } from '@/lib/prisma';
import { getDefaultGroupId } from '@/lib/default-group';

const PODIUM_POINTS = [3, 2, 1] as const;

function nightScore(profitCents: number, buyInCents: number): number {
    if (buyInCents <= 0) return 0;
    const buyInDollars = buyInCents / 100;
    const profitDollars = profitCents / 100;
    const roi = profitDollars / buyInDollars;
    return roi * Math.sqrt(buyInDollars);
}

export type PlayerListItem = {
    id: string;
    name: string;
    totalGames: number;
    totalBuyInCents: number;
    totalProfitCents: number;
    roi: number | null;
    nightsWon: number;
    podiumPoints: number;
    winRate: number;
    nightsInProfit: number;
};

export type PlayersListPageData = {
    players: PlayerListItem[];
};

/** Load all players in the default group with all-time stats (including players with 0 games). */
export async function loadPlayersListPageData(): Promise<PlayersListPageData | null> {
    const groupId = await getDefaultGroupId();

    const [allPlayers, games] = await Promise.all([
        prisma.player.findMany({
            where: { groupId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        }),
        prisma.game.findMany({
            where: { groupId, status: 'CLOSED' },
            orderBy: { scheduledAt: 'asc' },
            include: {
                players: {
                    include: { player: true }
                }
            }
        })
    ]);

    const byPlayerId = new Map<
        string,
        {
            name: string;
            totalBuyInCents: number;
            totalCashOutCents: number;
            totalProfitCents: number;
            totalGames: number;
            nightsWon: number;
            podiumPoints: number;
            nightsInProfit: number;
        }
    >();

    for (const g of games) {
        const sorted = [...g.players].sort((a, b) => {
            const cashA = a.cashOutCents ?? 0;
            const cashB = b.cashOutCents ?? 0;
            const profitA = cashA - a.buyInCents - a.adjustmentCents;
            const profitB = cashB - b.buyInCents - b.adjustmentCents;
            return profitB - profitA;
        });
        sorted.forEach((gp, i) => {
            const rank = i + 1;
            const cash = gp.cashOutCents ?? 0;
            const profitCents = cash - gp.buyInCents - gp.adjustmentCents;
            let rec = byPlayerId.get(gp.playerId);
            if (!rec) {
                rec = {
                    name: gp.player.name,
                    totalBuyInCents: 0,
                    totalCashOutCents: 0,
                    totalProfitCents: 0,
                    totalGames: 0,
                    nightsWon: 0,
                    podiumPoints: 0,
                    nightsInProfit: 0
                };
                byPlayerId.set(gp.playerId, rec);
            }
            rec.totalBuyInCents += gp.buyInCents;
            rec.totalCashOutCents += cash;
            rec.totalProfitCents += profitCents;
            rec.totalGames += 1;
            if (profitCents > 0) rec.nightsInProfit += 1;
            if (rank === 1) rec.nightsWon += 1;
            if (rank <= 3) rec.podiumPoints += PODIUM_POINTS[rank - 1];
        });
    }

    const players: PlayerListItem[] = allPlayers.map((p) => {
        const rec = byPlayerId.get(p.id);
        const totalGames = rec?.totalGames ?? 0;
        const totalBuyInCents = rec?.totalBuyInCents ?? 0;
        const totalProfitCents = rec?.totalProfitCents ?? 0;
        const roi =
            totalBuyInCents > 0 ? totalProfitCents / totalBuyInCents : null;
        return {
            id: p.id,
            name: p.name,
            totalGames,
            totalBuyInCents,
            totalProfitCents,
            roi,
            nightsWon: rec?.nightsWon ?? 0,
            podiumPoints: rec?.podiumPoints ?? 0,
            winRate: totalGames > 0 ? (rec?.nightsWon ?? 0) / totalGames : 0,
            nightsInProfit: rec?.nightsInProfit ?? 0
        };
    });

    return { players };
}

export type PlayerRecentGame = {
    gameId: string;
    gameName: string;
    scheduledAt: Date;
    buyInCents: number;
    cashOutCents: number | null;
    profitCents: number;
    nightScore: number;
    rank: number; // 1 = first by profit that night
};

export type PlayerProfileData = {
    player: { id: string; name: string };
    totalGames: number;
    totalBuyInCents: number;
    totalProfitCents: number;
    roi: number | null;
    nightsWon: number;
    podiumPoints: number;
    winRate: number;
    nightsInProfit: number;
    recentGames: PlayerRecentGame[];
};

/** Load one player's profile (must belong to default group). */
export async function loadPlayerProfile(
    playerId: string
): Promise<PlayerProfileData | null> {
    const groupId = await getDefaultGroupId();

    const player = await prisma.player.findFirst({
        where: { id: playerId, groupId },
        select: { id: true, name: true }
    });
    if (!player) return null;

    const gamePlayers = await prisma.gamePlayer.findMany({
        where: {
            playerId,
            game: { groupId, status: 'CLOSED' }
        },
        orderBy: { game: { scheduledAt: 'desc' } },
        include: {
            game: {
                select: {
                    id: true,
                    name: true,
                    scheduledAt: true,
                    players: {
                        select: {
                            playerId: true,
                            buyInCents: true,
                            cashOutCents: true,
                            adjustmentCents: true
                        }
                    }
                }
            }
        }
    });

    let totalBuyInCents = 0;
    let totalProfitCents = 0;
    let totalGames = 0;
    let nightsWon = 0;
    let podiumPoints = 0;
    let nightsInProfit = 0;

    const allGames: PlayerRecentGame[] = [];

    for (let i = 0; i < gamePlayers.length; i++) {
        const gp = gamePlayers[i];
        const g = gp.game;
        const cash = gp.cashOutCents ?? 0;
        const profitCents = cash - gp.buyInCents - gp.adjustmentCents;
        const score = nightScore(profitCents, gp.buyInCents);

        const sorted = [...g.players].sort((a, b) => {
            const cashA = a.cashOutCents ?? 0;
            const cashB = b.cashOutCents ?? 0;
            const pa = cashA - a.buyInCents - a.adjustmentCents;
            const pb = cashB - b.buyInCents - b.adjustmentCents;
            return pb - pa;
        });
        const rankIdx = sorted.findIndex((x) => x.playerId === playerId);
        const rank = rankIdx >= 0 ? rankIdx + 1 : 0;

        totalBuyInCents += gp.buyInCents;
        totalProfitCents += profitCents;
        totalGames += 1;
        if (profitCents > 0) nightsInProfit += 1;
        if (rank === 1) nightsWon += 1;
        if (rank >= 1 && rank <= 3) podiumPoints += PODIUM_POINTS[rank - 1];

        allGames.push({
            gameId: g.id,
            gameName: g.name,
            scheduledAt: g.scheduledAt,
            buyInCents: gp.buyInCents,
            cashOutCents: gp.cashOutCents,
            profitCents,
            nightScore: score,
            rank
        });
    }

    const roi =
        totalBuyInCents > 0 ? totalProfitCents / totalBuyInCents : null;
    const winRate = totalGames > 0 ? nightsWon / totalGames : 0;

    return {
        player: { id: player.id, name: player.name },
        totalGames,
        totalBuyInCents,
        totalProfitCents,
        roi,
        nightsWon,
        podiumPoints,
        winRate,
        nightsInProfit,
        recentGames: allGames
    };
}
