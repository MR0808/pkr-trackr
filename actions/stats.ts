'use server';

import { prisma } from '@/lib/prisma';
import { getDefaultGroupId } from '@/lib/default-group';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import type {
    StatsPageData,
    PlayerAllTimeRow,
    SeasonSummary,
    SeasonPlayerRow,
    StatsAwards
} from '@/types/stats';

const PODIUM_POINTS = [3, 2, 1] as const;

function seasonScore(profitCents: number, buyInCents: number): number | null {
    if (buyInCents <= 0) return null;
    const buyInDollars = buyInCents / 100;
    const profitDollars = profitCents / 100;
    const roi = profitDollars / buyInDollars;
    return roi * Math.sqrt(buyInDollars);
}

export async function loadStatsPageData(): Promise<StatsPageData | null> {
    const groupId = await getDefaultGroupId();
    const limits = getLeaderboardLimits();

    const games = await prisma.game.findMany({
        where: { groupId, status: 'CLOSED' },
        orderBy: { scheduledAt: 'asc' },
        include: {
            season: true,
            players: {
                include: { player: true }
            }
        }
    });

    if (games.length === 0) {
        return {
            allTime: {
                totalGames: 0,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalProfitCents: 0,
                players: []
            },
            seasons: [],
            awards: {
                bestSeason: null,
                bestPlayer: null,
                bestPerformer: null,
                topWinner: null,
                mostAction: null,
                podiumKing: null,
                nightsWonLeader: null,
                winRateLeader: null
            }
        };
    }

    type GamePlayerRow = {
        gameId: string;
        scheduledAt: Date;
        seasonId: string | null;
        seasonName: string | null;
        playerId: string;
        name: string;
        buyInCents: number;
        cashOutCents: number;
        profitCents: number;
    };

    const rows: GamePlayerRow[] = [];
    for (const g of games) {
        const nightPot = g.players.reduce((s, gp) => s + gp.buyInCents, 0);
        for (const gp of g.players) {
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            rows.push({
                gameId: g.id,
                scheduledAt: g.scheduledAt,
                seasonId: g.seasonId,
                seasonName: g.season?.name ?? null,
                playerId: gp.player.id,
                name: gp.player.name,
                buyInCents: gp.buyInCents,
                cashOutCents: cash,
                profitCents: profit
            });
        }
    }

    const gameIds = [...new Set(rows.map((r) => r.gameId))];
    const perGameRank: Map<string, { playerId: string; rank: number; profitCents: number }[]> = new Map();
    for (const gid of gameIds) {
        const gameRows = rows.filter((r) => r.gameId === gid);
        const sorted = [...gameRows].sort((a, b) => b.profitCents - a.profitCents);
        const ranked = sorted.map((r, i) => ({
            playerId: r.playerId,
            rank: i + 1,
            profitCents: r.profitCents
        }));
        perGameRank.set(gid, ranked);
    }

    const allTimeByPlayer = new Map<
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

    for (const r of rows) {
        let rec = allTimeByPlayer.get(r.playerId);
        if (!rec) {
            rec = {
                name: r.name,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalProfitCents: 0,
                totalGames: 0,
                nightsWon: 0,
                podiumPoints: 0,
                nightsInProfit: 0
            };
            allTimeByPlayer.set(r.playerId, rec);
        }
        rec.totalBuyInCents += r.buyInCents;
        rec.totalCashOutCents += r.cashOutCents;
        rec.totalProfitCents += r.profitCents;
        rec.totalGames += 1;
        if (r.profitCents > 0) rec.nightsInProfit += 1;

        const rankList = perGameRank.get(r.gameId)!;
        const rankEntry = rankList.find((x) => x.playerId === r.playerId)!;
        if (rankEntry.rank === 1) rec.nightsWon += 1;
        if (rankEntry.rank <= 3) rec.podiumPoints += PODIUM_POINTS[rankEntry.rank - 1];
    }

    const allTimePlayers: PlayerAllTimeRow[] = [];
    let totalBuyInCents = 0;
    let totalCashOutCents = 0;
    for (const [playerId, rec] of allTimeByPlayer) {
        totalBuyInCents += rec.totalBuyInCents;
        totalCashOutCents += rec.totalCashOutCents;
        const meetsLimit =
            rec.totalGames >= limits.minNightsPlayed &&
            rec.totalBuyInCents >= limits.minTotalBuyInCents;
        if (!meetsLimit) continue;

        const roi =
            rec.totalBuyInCents > 0 ? rec.totalProfitCents / rec.totalBuyInCents : null;
        const score = seasonScore(rec.totalProfitCents, rec.totalBuyInCents);
        allTimePlayers.push({
            playerId,
            name: rec.name,
            totalBuyInCents: rec.totalBuyInCents,
            totalCashOutCents: rec.totalCashOutCents,
            totalProfitCents: rec.totalProfitCents,
            totalGames: rec.totalGames,
            roi: roi ?? null,
            seasonScore: score,
            nightsWon: rec.nightsWon,
            podiumPoints: rec.podiumPoints,
            winRate: rec.totalGames > 0 ? rec.nightsWon / rec.totalGames : 0,
            nightsInProfit: rec.nightsInProfit,
            consistency: rec.totalGames > 0 ? rec.nightsInProfit / rec.totalGames : 0
        });
    }

    const totalProfitCents = totalCashOutCents - totalBuyInCents;

    const seasonIds = [...new Set(rows.map((r) => r.seasonId).filter(Boolean))] as string[];
    const seasonMap = new Map<
        string,
        {
            name: string;
            startsAt: Date;
            endsAt: Date | null;
            totalGames: number;
            totalBuyInCents: number;
            totalCashOutCents: number;
            totalProfitCents: number;
            byPlayer: Map<
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
    >;
        }
    >();

    const seasonMeta = await prisma.season.findMany({
        where: { id: { in: seasonIds } },
        select: { id: true, name: true, startsAt: true, endsAt: true }
    });
    for (const s of seasonMeta) {
        seasonMap.set(s.id, {
            name: s.name,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            totalGames: 0,
            totalBuyInCents: 0,
            totalCashOutCents: 0,
            totalProfitCents: 0,
            byPlayer: new Map()
        });
    }

    const perGameTotals = new Map<
        string,
        { seasonId: string | null; buyInCents: number; cashOutCents: number }
    >();
    for (const gid of gameIds) {
        const gameRows = rows.filter((r) => r.gameId === gid);
        const buyInCents = gameRows.reduce((s, r) => s + r.buyInCents, 0);
        const cashOutCents = gameRows.reduce((s, r) => s + r.cashOutCents, 0);
        perGameTotals.set(gid, {
            seasonId: gameRows[0]?.seasonId ?? null,
            buyInCents,
            cashOutCents
        });
    }

    for (const [gid, tot] of perGameTotals) {
        const sid = tot.seasonId;
        if (!sid || !seasonMap.has(sid)) continue;
        const seg = seasonMap.get(sid)!;
        seg.totalGames += 1;
        seg.totalBuyInCents += tot.buyInCents;
        seg.totalCashOutCents += tot.cashOutCents;
        seg.totalProfitCents += tot.cashOutCents - tot.buyInCents;
    }

    for (const r of rows) {
        const sid = r.seasonId;
        if (!sid || !seasonMap.has(sid)) continue;
        const seg = seasonMap.get(sid)!;

        let prec = seg.byPlayer.get(r.playerId);
        if (!prec) {
            prec = {
                name: r.name,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalProfitCents: 0,
                totalGames: 0,
                nightsWon: 0,
                podiumPoints: 0,
                nightsInProfit: 0
            };
            seg.byPlayer.set(r.playerId, prec);
        }
        prec.totalBuyInCents += r.buyInCents;
        prec.totalCashOutCents += r.cashOutCents;
        prec.totalProfitCents += r.profitCents;
        prec.totalGames += 1;
        if (r.profitCents > 0) prec.nightsInProfit += 1;

        const rankList = perGameRank.get(r.gameId)!;
        const rankEntry = rankList.find((x) => x.playerId === r.playerId)!;
        if (rankEntry.rank === 1) prec.nightsWon += 1;
        if (rankEntry.rank <= 3) prec.podiumPoints += PODIUM_POINTS[rankEntry.rank - 1];
    }

    const seasons: SeasonSummary[] = [];
    for (const [seasonId, seg] of seasonMap) {
        const meta = seasonMeta.find((s) => s.id === seasonId)!;
        const playerRows: SeasonPlayerRow[] = [];
        for (const [playerId, prec] of seg.byPlayer) {
            const roi = prec.totalBuyInCents > 0 ? prec.totalProfitCents / prec.totalBuyInCents : null;
            const score = seasonScore(prec.totalProfitCents, prec.totalBuyInCents);
            playerRows.push({
                playerId,
                name: prec.name,
                totalBuyInCents: prec.totalBuyInCents,
                totalCashOutCents: prec.totalCashOutCents,
                totalProfitCents: prec.totalProfitCents,
                totalGames: prec.totalGames,
                roi,
                seasonScore: score,
                nightsWon: prec.nightsWon,
                podiumPoints: prec.podiumPoints,
                winRate: prec.totalGames > 0 ? prec.nightsWon / prec.totalGames : 0,
                nightsInProfit: prec.nightsInProfit,
                consistency: prec.totalGames > 0 ? prec.nightsInProfit / prec.totalGames : 0
            });
        }
        const sortedByProfit = [...playerRows].sort((a, b) => b.totalProfitCents - a.totalProfitCents);
        const sortedByROI = [...playerRows].filter((p) => p.roi != null).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
        const sortedByScore = [...playerRows].filter((p) => p.seasonScore != null).sort((a, b) => (b.seasonScore ?? 0) - (a.seasonScore ?? 0));
        seasons.push({
            seasonId,
            name: seg.name,
            startsAt: seg.startsAt,
            endsAt: seg.endsAt,
            totalGames: seg.totalGames,
            totalBuyInCents: seg.totalBuyInCents,
            totalCashOutCents: seg.totalCashOutCents,
            totalProfitCents: seg.totalProfitCents,
            players: playerRows,
            topWinner: sortedByProfit[0] ? { name: sortedByProfit[0].name, playerId: sortedByProfit[0].playerId, profitCents: sortedByProfit[0].totalProfitCents } : null,
            bestROI: sortedByROI[0] ? { name: sortedByROI[0].name, playerId: sortedByROI[0].playerId, roi: sortedByROI[0].roi! } : null,
            bestPerformer: sortedByScore[0] ? { name: sortedByScore[0].name, playerId: sortedByScore[0].playerId, seasonScore: sortedByScore[0].seasonScore! } : null
        });
    }
    seasons.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

    let bestSeason: StatsAwards['bestSeason'] = null;
    for (const s of seasons) {
        if (!bestSeason || s.totalProfitCents > bestSeason.totalProfitCents) {
            bestSeason = { seasonName: s.name, seasonId: s.seasonId, totalProfitCents: s.totalProfitCents };
        }
    }

    let bestPlayer: StatsAwards['bestPlayer'] = null;
    let bestPerformer: StatsAwards['bestPerformer'] = null;
    for (const s of seasons) {
        for (const p of s.players) {
            if (p.totalGames >= 1 && p.roi != null && (!bestPlayer || p.roi > bestPlayer.roi)) {
                bestPlayer = { name: p.name, playerId: p.playerId, roi: p.roi, seasonName: s.name };
            }
            if (p.seasonScore != null && (!bestPerformer || p.seasonScore > bestPerformer.seasonScore)) {
                bestPerformer = { name: p.name, playerId: p.playerId, seasonScore: p.seasonScore, seasonName: s.name };
            }
        }
    }

    const sortedProfit = [...allTimePlayers].sort((a, b) => b.totalProfitCents - a.totalProfitCents);
    const sortedBuyIn = [...allTimePlayers].sort((a, b) => b.totalBuyInCents - a.totalBuyInCents);
    const sortedPodium = [...allTimePlayers].sort((a, b) => b.podiumPoints - a.podiumPoints);
    const sortedNightsWon = [...allTimePlayers].sort((a, b) => b.nightsWon - a.nightsWon);
    const winRateCandidates = allTimePlayers.filter((p) => p.totalGames >= 5);
    const sortedWinRate = [...winRateCandidates].sort((a, b) => b.winRate - a.winRate);

    const awards: StatsAwards = {
        bestSeason,
        bestPlayer,
        bestPerformer,
        topWinner: sortedProfit[0] ? { name: sortedProfit[0].name, playerId: sortedProfit[0].playerId, totalProfitCents: sortedProfit[0].totalProfitCents } : null,
        mostAction: sortedBuyIn[0] ? { name: sortedBuyIn[0].name, playerId: sortedBuyIn[0].playerId, totalBuyInCents: sortedBuyIn[0].totalBuyInCents } : null,
        podiumKing: sortedPodium[0] ? { name: sortedPodium[0].name, playerId: sortedPodium[0].playerId, podiumPoints: sortedPodium[0].podiumPoints } : null,
        nightsWonLeader: sortedNightsWon[0] ? { name: sortedNightsWon[0].name, playerId: sortedNightsWon[0].playerId, nightsWon: sortedNightsWon[0].nightsWon } : null,
        winRateLeader: sortedWinRate[0] ? { name: sortedWinRate[0].name, playerId: sortedWinRate[0].playerId, winRate: sortedWinRate[0].winRate, games: sortedWinRate[0].totalGames } : null
    };

    return {
        allTime: {
            totalGames: games.length,
            totalBuyInCents,
            totalCashOutCents,
            totalProfitCents,
            players: allTimePlayers.sort((a, b) => b.totalProfitCents - a.totalProfitCents)
        },
        seasons,
        awards
    };
}
