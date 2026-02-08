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
    rank: number;
    roi: number | null;
    tableShare: number | null;
    /** Total pot (all buy-ins) for this night */
    totalPotCents: number;
    seasonId: string | null;
    seasonName: string | null;
};

export type PlayerSeasonResult = {
    seasonId: string | null;
    seasonName: string;
    nightsPlayed: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
    roi: number | null;
    performanceScore: number | null;
    avgTableShare: number | null;
};

export type PlayerBestWorstNight = {
    gameId: string;
    gameName: string;
    scheduledAt: Date;
    buyInCents: number;
    cashOutCents: number | null;
    profitCents: number;
    roi: number | null;
    tableShare: number | null;
    totalPotCents: number;
};

export type PlayerProfileData = {
    player: {
        id: string;
        name: string;
        fullName: string; // firstName + lastName from user, or name
        image: string | null;
    };
    totalGames: number;
    totalBuyInCents: number;
    totalProfitCents: number;
    roi: number | null;
    nightsWon: number;
    podiumPoints: number;
    winRate: number;
    nightsInProfit: number;
    currentStreak: number;
    longestWinStreak: number;
    longestLoseStreak: number;
    /** Current season (season of most recent game); null if no games */
    currentSeason: { id: string; name: string } | null;
    /** Profit and ROI for current season only */
    currentSeasonProfitCents: number;
    currentSeasonRoi: number | null;
    recentGames: PlayerRecentGame[];
    seasonResults: PlayerSeasonResult[];
    bestNight: PlayerBestWorstNight | null;
    worstNight: PlayerBestWorstNight | null;
};

/** Load one player's profile (must belong to default group). */
export async function loadPlayerProfile(
    playerId: string
): Promise<PlayerProfileData | null> {
    const groupId = await getDefaultGroupId();

    const player = await prisma.player.findFirst({
        where: { id: playerId, groupId },
        select: {
            id: true,
            name: true,
            user: {
                select: { firstName: true, lastName: true, image: true }
            }
        }
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
                    seasonId: true,
                    season: { select: { id: true, name: true } },
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

        const totalPotCents = g.players.reduce((s, p) => s + p.buyInCents, 0);
        const roi = gp.buyInCents > 0 ? profitCents / gp.buyInCents : null;
        const tableShare = totalPotCents > 0 ? gp.buyInCents / totalPotCents : null;

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
            rank,
            roi,
            tableShare,
            totalPotCents: totalPotCents,
            seasonId: g.seasonId,
            seasonName: g.season?.name ?? null
        });
    }

    const roi =
        totalBuyInCents > 0 ? totalProfitCents / totalBuyInCents : null;
    const winRate = totalGames > 0 ? nightsWon / totalGames : 0;

    // Per-season aggregates
    const seasonMap = new Map<
        string,
        {
            seasonName: string;
            nightsPlayed: number;
            totalBuyInCents: number;
            totalCashOutCents: number;
            totalProfitCents: number;
            tableShareSum: number;
            tableShareCount: number;
        }
    >();
    for (const g of allGames) {
        const key = g.seasonId ?? 'all';
        const label = g.seasonName ?? 'No season';
        let rec = seasonMap.get(key);
        if (!rec) {
            rec = {
                seasonName: label,
                nightsPlayed: 0,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalProfitCents: 0,
                tableShareSum: 0,
                tableShareCount: 0
            };
            seasonMap.set(key, rec);
        }
        rec.nightsPlayed += 1;
        rec.totalBuyInCents += g.buyInCents;
        rec.totalCashOutCents += g.cashOutCents ?? 0;
        rec.totalProfitCents += g.profitCents;
        if (g.tableShare != null) {
            rec.tableShareSum += g.tableShare;
            rec.tableShareCount += 1;
        }
    }
    const seasonResults: PlayerSeasonResult[] = [];
    for (const [sid, rec] of seasonMap) {
        const perfScore =
            rec.totalBuyInCents > 0
                ? nightScore(rec.totalProfitCents, rec.totalBuyInCents)
                : null;
        seasonResults.push({
            seasonId: sid === 'all' ? null : sid,
            seasonName: rec.seasonName,
            nightsPlayed: rec.nightsPlayed,
            totalBuyInCents: rec.totalBuyInCents,
            totalCashOutCents: rec.totalCashOutCents,
            totalProfitCents: rec.totalProfitCents,
            roi:
                rec.totalBuyInCents > 0
                    ? rec.totalProfitCents / rec.totalBuyInCents
                    : null,
            performanceScore: perfScore,
            avgTableShare:
                rec.tableShareCount > 0
                    ? rec.tableShareSum / rec.tableShareCount
                    : null
        });
    }
    const totalCashOutCents = totalBuyInCents + totalProfitCents;
    const allTimeTableShareSum = allGames.reduce(
        (s, g) => s + (g.tableShare ?? 0),
        0
    );
    const allTimeTableShareCount = allGames.filter(
        (g) => g.tableShare != null
    ).length;
    seasonResults.push({
        seasonId: null,
        seasonName: 'All time',
        nightsPlayed: totalGames,
        totalBuyInCents,
        totalCashOutCents,
        totalProfitCents,
        roi,
        performanceScore:
            totalBuyInCents > 0
                ? nightScore(totalProfitCents, totalBuyInCents)
                : null,
        avgTableShare:
            allTimeTableShareCount > 0
                ? allTimeTableShareSum / allTimeTableShareCount
                : null
    });
    seasonResults.sort((a, b) => b.nightsPlayed - a.nightsPlayed);

    const currentSeason =
        allGames.length > 0 && allGames[0].seasonId && allGames[0].seasonName
            ? { id: allGames[0].seasonId, name: allGames[0].seasonName }
            : null;
    const currentSeasonGames = currentSeason
        ? allGames.filter((g) => g.seasonId === currentSeason.id)
        : [];
    const currentSeasonProfitCents = currentSeasonGames.reduce(
        (s, g) => s + g.profitCents,
        0
    );
    const currentSeasonBuyIn = currentSeasonGames.reduce(
        (s, g) => s + g.buyInCents,
        0
    );
    const currentSeasonRoi =
        currentSeasonBuyIn > 0
            ? currentSeasonProfitCents / currentSeasonBuyIn
            : null;

    const bestGame = allGames.reduce((best, g) =>
        g.profitCents > (best?.profitCents ?? -Infinity) ? g : best
    );
    const worstGame = allGames.reduce((worst, g) =>
        g.profitCents < (worst?.profitCents ?? Infinity) ? g : worst
    );
    const bestNight: PlayerBestWorstNight | null =
        bestGame && bestGame.profitCents > 0
            ? {
                  gameId: bestGame.gameId,
                  gameName: bestGame.gameName,
                  scheduledAt: bestGame.scheduledAt,
                  buyInCents: bestGame.buyInCents,
                  cashOutCents: bestGame.cashOutCents,
                  profitCents: bestGame.profitCents,
                  roi: bestGame.roi,
                  tableShare: bestGame.tableShare,
                  totalPotCents: bestGame.totalPotCents
              }
            : null;
    const worstNight: PlayerBestWorstNight | null =
        worstGame && worstGame.profitCents < 0
            ? {
                  gameId: worstGame.gameId,
                  gameName: worstGame.gameName,
                  scheduledAt: worstGame.scheduledAt,
                  buyInCents: worstGame.buyInCents,
                  cashOutCents: worstGame.cashOutCents,
                  profitCents: worstGame.profitCents,
                  roi: worstGame.roi,
                  tableShare: worstGame.tableShare,
                  totalPotCents: worstGame.totalPotCents
              }
            : null;

    const fullName =
        player.user?.firstName && player.user?.lastName
            ? `${player.user.firstName} ${player.user.lastName}`.trim()
            : player.name;

    // Current streak (from most recent game)
    let currentStreak = 0;
    if (allGames.length > 0) {
        const sign = allGames[0].profitCents > 0 ? 1 : allGames[0].profitCents < 0 ? -1 : 0;
        for (const g of allGames) {
            const s = g.profitCents > 0 ? 1 : g.profitCents < 0 ? -1 : 0;
            if (s !== sign) break;
            currentStreak += sign;
        }
    }

    // Longest win/lose streaks (chronological: oldest first)
    const chrono = [...allGames].reverse();
    let longestWinStreak = 0;
    let longestLoseStreak = 0;
    let curWin = 0;
    let curLose = 0;
    for (const g of chrono) {
        if (g.profitCents > 0) {
            curWin++;
            curLose = 0;
            longestWinStreak = Math.max(longestWinStreak, curWin);
        } else if (g.profitCents < 0) {
            curLose++;
            curWin = 0;
            longestLoseStreak = Math.max(longestLoseStreak, curLose);
        } else {
            curWin = 0;
            curLose = 0;
        }
    }

    return {
        player: {
            id: player.id,
            name: player.name,
            fullName,
            image: player.user?.image ?? null
        },
        totalGames,
        totalBuyInCents,
        totalProfitCents,
        roi,
        nightsWon,
        podiumPoints,
        winRate,
        nightsInProfit,
        currentStreak,
        longestWinStreak,
        longestLoseStreak,
        currentSeason,
        currentSeasonProfitCents,
        currentSeasonRoi,
        recentGames: allGames,
        seasonResults,
        bestNight,
        worstNight
    };
}

// --- Player rank & comparison (social) ---

export type PlayerRankRow = {
    rank: number;
    playerId: string;
    name: string;
    totalProfitCents: number;
    roi: number | null;
};

export type PlayerComparisonData = {
    currentSeasonName: string | null;
    currentSeasonRank: number | null;
    currentSeasonTotalPlayers: number;
    allTimeRank: number | null;
    allTimeTotalPlayers: number;
    topPlayersCurrentSeason: PlayerRankRow[];
    topPlayersAllTime: PlayerRankRow[];
};

/** Load league-wide ranks and top players for comparison. Uses currentSeasonId from profile. */
export async function loadPlayerComparison(
    playerId: string,
    currentSeasonId: string | null
): Promise<PlayerComparisonData | null> {
    const groupId = await getDefaultGroupId();

    const player = await prisma.player.findFirst({
        where: { id: playerId, groupId },
        select: { id: true }
    });
    if (!player) return null;

    const games = await prisma.game.findMany({
        where: { groupId, status: 'CLOSED' },
        orderBy: { scheduledAt: 'asc' },
        select: {
            seasonId: true,
            players: {
                select: {
                    playerId: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true,
                    player: { select: { name: true } }
                }
            }
        }
    });

    type Agg = { name: string; totalProfitCents: number; totalBuyInCents: number };
    const allTimeByPlayer = new Map<string, Agg>();
    const seasonByPlayer = new Map<string, Agg>();

    for (const g of games) {
        for (const gp of g.players) {
            const cash = gp.cashOutCents ?? 0;
            const profitCents = cash - gp.buyInCents - gp.adjustmentCents;

            let allRec = allTimeByPlayer.get(gp.playerId);
            if (!allRec) {
                allRec = {
                    name: gp.player.name,
                    totalProfitCents: 0,
                    totalBuyInCents: 0
                };
                allTimeByPlayer.set(gp.playerId, allRec);
            }
            allRec.totalProfitCents += profitCents;
            allRec.totalBuyInCents += gp.buyInCents;

            if (currentSeasonId && g.seasonId === currentSeasonId) {
                let seaRec = seasonByPlayer.get(gp.playerId);
                if (!seaRec) {
                    seaRec = {
                        name: gp.player.name,
                        totalProfitCents: 0,
                        totalBuyInCents: 0
                    };
                    seasonByPlayer.set(gp.playerId, seaRec);
                }
                seaRec.totalProfitCents += profitCents;
                seaRec.totalBuyInCents += gp.buyInCents;
            }
        }
    }

    const allTimeSorted = [...allTimeByPlayer.entries()]
        .map(([id, r]) => ({
            playerId: id,
            name: r.name,
            totalProfitCents: r.totalProfitCents,
            roi:
                r.totalBuyInCents > 0
                    ? r.totalProfitCents / r.totalBuyInCents
                    : null
        }))
        .sort((a, b) => b.totalProfitCents - a.totalProfitCents);

    const allTimeRank =
        allTimeSorted.findIndex((r) => r.playerId === playerId) + 1 || null;
    const topPlayersAllTime: PlayerRankRow[] = allTimeSorted.slice(0, 5).map(
        (r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            name: r.name,
            totalProfitCents: r.totalProfitCents,
            roi: r.roi
        })
    );

    let currentSeasonName: string | null = null;
    let currentSeasonRank: number | null = null;
    let currentSeasonTotalPlayers = 0;
    let topPlayersCurrentSeason: PlayerRankRow[] = [];

    if (currentSeasonId && seasonByPlayer.size > 0) {
        const seasonMeta = await prisma.season.findUnique({
            where: { id: currentSeasonId },
            select: { name: true }
        });
        currentSeasonName = seasonMeta?.name ?? null;
        const seasonSorted = [...seasonByPlayer.entries()]
            .map(([id, r]) => ({
                playerId: id,
                name: r.name,
                totalProfitCents: r.totalProfitCents,
                roi:
                    r.totalBuyInCents > 0
                        ? r.totalProfitCents / r.totalBuyInCents
                        : null
            }))
            .sort((a, b) => b.totalProfitCents - a.totalProfitCents);
        currentSeasonTotalPlayers = seasonSorted.length;
        currentSeasonRank =
            seasonSorted.findIndex((r) => r.playerId === playerId) + 1 || null;
        topPlayersCurrentSeason = seasonSorted.slice(0, 5).map((r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            name: r.name,
            totalProfitCents: r.totalProfitCents,
            roi: r.roi
        }));
    }

    return {
        currentSeasonName,
        currentSeasonRank,
        currentSeasonTotalPlayers,
        allTimeRank,
        allTimeTotalPlayers: allTimeSorted.length,
        topPlayersCurrentSeason,
        topPlayersAllTime
    };
}
