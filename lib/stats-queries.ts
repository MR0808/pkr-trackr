import { prisma } from '@/lib/prisma';
import { buildGameWhereFromFilters, getEligibilityThresholds } from '@/lib/stats-filters';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import type { StatsFilters } from '@/schemas/statsFilters';
import type {
    LeagueStatsOverview,
    RecentNightRow,
    ActivityTrendPoint,
    RecordItem,
    NightTableRow,
    SeasonTableRow,
    PlayerStatsRow,
    RollingFormRow,
    CompetitivenessResult,
    DistributionBucket,
    SkillRatingRow,
    InsightsNarrative,
    HeaterIndexRow
} from '@/types/stats';

const PODIUM_POINTS = [3, 2, 1] as const;

function seasonScore(profitCents: number, buyInCents: number): number | null {
    if (buyInCents <= 0) return null;
    const buyInDollars = buyInCents / 100;
    const profitDollars = profitCents / 100;
    const roi = profitDollars / buyInDollars;
    return roi * Math.sqrt(buyInDollars);
}

type GameWithPlayers = Awaited<
    ReturnType<typeof prisma.game.findMany<{
        where: object;
        include: { season: true; players: { include: { player: true } } };
    }>>
>;

/** Load games for group with filters; used by multiple query helpers. Returns all matching games (no take limit). */
async function loadFilteredGames(
    groupId: string,
    filters: StatsFilters
): Promise<GameWithPlayers> {
    const where = buildGameWhereFromFilters(groupId, filters);
    return prisma.game.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        include: {
            season: true,
            players: { include: { player: true } }
        }
    });
}

/** Flat row per game-player for in-memory aggregation */
type FlatRow = {
    gameId: string;
    scheduledAt: Date;
    seasonId: string | null;
    playerId: string;
    name: string;
    buyInCents: number;
    cashOutCents: number;
    profitCents: number;
    potCents: number;
    playerCount: number;
};

function gamesToFlatRows(games: GameWithPlayers): FlatRow[] {
    const rows: FlatRow[] = [];
    for (const g of games) {
        const potCents = g.players.reduce((s, gp) => s + gp.buyInCents, 0);
        const playerCount = g.players.length;
        for (const gp of g.players) {
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            rows.push({
                gameId: g.id,
                scheduledAt: g.scheduledAt,
                seasonId: g.seasonId,
                playerId: gp.player.id,
                name: gp.player.name,
                buyInCents: gp.buyInCents,
                cashOutCents: cash,
                profitCents: profit,
                potCents,
                playerCount
            });
        }
    }
    return rows;
}

/** In-memory: league overview from already-loaded games (avoids duplicate DB load). */
function computeLeagueStatsOverviewFromGames(games: GameWithPlayers): LeagueStatsOverview {
    if (games.length === 0) {
        return {
            totalNights: 0,
            totalPotCents: 0,
            averagePotCents: 0,
            averagePotLast10Cents: null,
            largestPotCents: 0,
            uniquePlayersAllTime: 0,
            uniquePlayersLast30Days: 0,
            averagePlayersPerNight: 0
        };
    }
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let totalPot = 0;
    let largestPot = 0;
    const playerIdsAllTime = new Set<string>();
    const playerIdsLast30 = new Set<string>();
    let sumPlayers = 0;
    for (const g of games) {
        const pot = g.players.reduce((s, gp) => s + gp.buyInCents, 0);
        totalPot += pot;
        if (pot > largestPot) largestPot = pot;
        sumPlayers += g.players.length;
        for (const gp of g.players) {
            playerIdsAllTime.add(gp.playerId);
            if (g.scheduledAt >= thirtyDaysAgo) playerIdsLast30.add(gp.playerId);
        }
    }
    const last10 = games.slice(-10);
    const avgPotLast10 =
        last10.length > 0
            ? last10.reduce((s, g) => s + g.players.reduce((a, p) => a + p.buyInCents, 0), 0) /
              last10.length
            : null;
    return {
        totalNights: games.length,
        totalPotCents: totalPot,
        averagePotCents: games.length ? Math.round(totalPot / games.length) : 0,
        averagePotLast10Cents: avgPotLast10 != null ? Math.round(avgPotLast10) : null,
        largestPotCents: largestPot,
        uniquePlayersAllTime: playerIdsAllTime.size,
        uniquePlayersLast30Days: playerIdsLast30.size,
        averagePlayersPerNight:
            games.length ? Math.round((sumPlayers / games.length) * 100) / 100 : 0
    };
}

function computeLeagueActivityTrendFromGames(
    games: GameWithPlayers,
    filters: StatsFilters,
    limitPoints?: number
): ActivityTrendPoint[] {
    const dateRange = String(filters.dateRange ?? 'all');
    const limit =
        limitPoints ?? (dateRange === 'all' ? 100 : 50);
    const slice = games.slice(-limit);
    return slice.map((g) => ({
        date: g.scheduledAt.toISOString().slice(0, 10),
        potCents: g.players.reduce((s, p) => s + p.buyInCents, 0),
        playersCount: g.players.length
    }));
}

function computeRecentActivityFromGames(
    games: GameWithPlayers,
    limit: number
): RecentNightRow[] {
    const last = games.slice(-limit).reverse();
    const result: RecentNightRow[] = [];
    for (const g of last) {
        const potCents = g.players.reduce((s, p) => s + p.buyInCents, 0);
        const withProfit = g.players.map((gp) => {
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            return { playerId: gp.player.id, name: gp.player.name, profitCents: profit };
        });
        const winner = withProfit.sort((a, b) => b.profitCents - a.profitCents)[0];
        result.push({
            gameId: g.id,
            date: g.scheduledAt,
            potCents,
            playersCount: g.players.length,
            biggestWinnerName: winner?.name ?? '—',
            biggestWinnerPlayerId: winner?.playerId ?? '',
            biggestWinnerProfitCents: winner?.profitCents ?? 0
        });
    }
    return result;
}

function computeRecordsFromGames(games: GameWithPlayers): RecordItem[] {
    const rows = gamesToFlatRows(games);
    const items: RecordItem[] = [];
    if (rows.length === 0) return items;
    const byGame = new Map<string, typeof rows>();
    for (const r of rows) {
        if (!byGame.has(r.gameId)) byGame.set(r.gameId, []);
        byGame.get(r.gameId)!.push(r);
    }
    let biggestNightProfit = -Infinity;
    let biggestNightLoss = Infinity;
    let largestPot = 0;
    let bestGameId: string | undefined;
    let worstGameId: string | undefined;
    let largestPotGameId: string | undefined;
    let bestPlayerId: string | undefined;
    let bestPlayerName: string | undefined;
    let worstPlayerId: string | undefined;
    let worstPlayerName: string | undefined;
    for (const [, gameRows] of byGame) {
        const pot = gameRows[0]?.potCents ?? 0;
        const maxProfit = Math.max(...gameRows.map((r) => r.profitCents));
        const minProfit = Math.min(...gameRows.map((r) => r.profitCents));
        const gameId = gameRows[0]?.gameId;
        if (maxProfit > biggestNightProfit) {
            biggestNightProfit = maxProfit;
            bestGameId = gameId;
            const r = gameRows.find((x) => x.profitCents === maxProfit);
            bestPlayerId = r?.playerId;
            bestPlayerName = r?.name;
        }
        if (minProfit < biggestNightLoss) {
            biggestNightLoss = minProfit;
            worstGameId = gameId;
            const r = gameRows.find((x) => x.profitCents === minProfit);
            worstPlayerId = r?.playerId;
            worstPlayerName = r?.name;
        }
        if (pot > largestPot) {
            largestPot = pot;
            largestPotGameId = gameId;
        }
    }
    const formatCents = (c: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(c / 100);
    if (bestPlayerName != null && biggestNightProfit > -Infinity) {
        items.push({
            label: 'Biggest single-night profit',
            value: formatCents(biggestNightProfit),
            playerId: bestPlayerId,
            gameId: bestGameId,
            playerName: bestPlayerName
        });
    }
    if (worstPlayerName != null && biggestNightLoss < Infinity) {
        items.push({
            label: 'Biggest single-night loss',
            value: formatCents(biggestNightLoss),
            playerId: worstPlayerId,
            gameId: worstGameId,
            playerName: worstPlayerName
        });
    }
    if (largestPotGameId) {
        items.push({
            label: 'Largest pot night',
            value: formatCents(largestPot),
            gameId: largestPotGameId
        });
    }
    const byPlayer = new Map<string, { profitCents: number }[]>();
    for (const r of rows) {
        if (!byPlayer.has(r.playerId)) byPlayer.set(r.playerId, []);
        byPlayer.get(r.playerId)!.push({ profitCents: r.profitCents });
    }
    const gameOrder = [...new Set(rows.map((r) => r.gameId))];
    const gameIndex = new Map(gameOrder.map((id, i) => [id, i]));
    let longestWin = 0;
    let longestLoss = 0;
    let winPlayerId: string | undefined;
    let winPlayerName: string | undefined;
    let lossPlayerId: string | undefined;
    let lossPlayerName: string | undefined;
    for (const [playerId, profits] of byPlayer) {
        const name = profits.length ? rows.find((r) => r.playerId === playerId)?.name : undefined;
        const sortedGames = rows
            .filter((r) => r.playerId === playerId)
            .sort((a, b) => gameIndex.get(a.gameId)! - gameIndex.get(b.gameId)!);
        let winStreak = 0;
        let lossStreak = 0;
        let maxWin = 0;
        let maxLoss = 0;
        for (const r of sortedGames) {
            if (r.profitCents > 0) {
                winStreak++;
                lossStreak = 0;
                if (winStreak > maxWin) maxWin = winStreak;
            } else if (r.profitCents < 0) {
                lossStreak++;
                winStreak = 0;
                if (lossStreak > maxLoss) maxLoss = lossStreak;
            } else {
                winStreak = 0;
                lossStreak = 0;
            }
        }
        if (maxWin > longestWin) {
            longestWin = maxWin;
            winPlayerId = playerId;
            winPlayerName = name;
        }
        if (maxLoss > longestLoss) {
            longestLoss = maxLoss;
            lossPlayerId = playerId;
            lossPlayerName = name;
        }
    }
    if (longestWin > 0 && winPlayerName) {
        items.push({
            label: 'Longest winning streak (nights)',
            value: String(longestWin),
            playerId: winPlayerId,
            playerName: winPlayerName
        });
    }
    if (longestLoss > 0 && lossPlayerName) {
        items.push({
            label: 'Longest losing streak (nights)',
            value: String(longestLoss),
            playerId: lossPlayerId,
            playerName: lossPlayerName
        });
    }
    return items;
}

function computePlayersLeaderboardFromGames(
    games: GameWithPlayers,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number }
): { players: PlayerStatsRow[]; totalCount: number } {
    const rows = gamesToFlatRows(games);
    const { minNightsPlayed, minTotalBuyInCents } = getEligibilityThresholds(filters, limits);
    const byPlayer = new Map<
        string,
        {
            name: string;
            totalBuyInCents: number;
            totalCashOutCents: number;
            totalGames: number;
            nightsInProfit: number;
            bestNightProfit: number;
            worstNightLoss: number;
            potWeightedScoreSum: number;
        }
    >();
    for (const r of rows) {
        let rec = byPlayer.get(r.playerId);
        if (!rec) {
            rec = {
                name: r.name,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalGames: 0,
                nightsInProfit: 0,
                bestNightProfit: -Infinity,
                worstNightLoss: Infinity,
                potWeightedScoreSum: 0
            };
            byPlayer.set(r.playerId, rec);
        }
        rec.totalBuyInCents += r.buyInCents;
        rec.totalCashOutCents += r.cashOutCents;
        rec.totalGames += 1;
        if (r.profitCents > 0) rec.nightsInProfit += 1;
        if (r.profitCents > rec.bestNightProfit) rec.bestNightProfit = r.profitCents;
        if (r.profitCents < rec.worstNightLoss) rec.worstNightLoss = r.profitCents;
        if (r.potCents > 0) {
            const score = (r.profitCents / 100) * Math.sqrt(r.potCents / 100);
            rec.potWeightedScoreSum += score;
        }
    }
    const players: PlayerStatsRow[] = [];
    for (const [playerId, rec] of byPlayer) {
        const totalProfitCents = rec.totalCashOutCents - rec.totalBuyInCents;
        const roi =
            rec.totalBuyInCents > 0
                ? totalProfitCents / rec.totalBuyInCents
                : null;
        const meetsEligibility =
            rec.totalGames >= minNightsPlayed &&
            rec.totalBuyInCents >= minTotalBuyInCents;
        players.push({
            playerId,
            name: rec.name,
            nightsPlayed: rec.totalGames,
            totalBuyInCents: rec.totalBuyInCents,
            totalCashOutCents: rec.totalCashOutCents,
            totalProfitCents: totalProfitCents,
            roi,
            performanceScore:
                rec.totalBuyInCents > 0
                    ? seasonScore(totalProfitCents, rec.totalBuyInCents)
                    : null,
            winRate: rec.totalGames > 0 ? rec.nightsInProfit / rec.totalGames : 0,
            bestNightProfitCents:
                rec.bestNightProfit > -Infinity ? rec.bestNightProfit : null,
            worstNightLossCents:
                rec.worstNightLoss < Infinity ? rec.worstNightLoss : null,
            meetsEligibility
        });
    }
    return {
        players: players.sort((a, b) => b.totalProfitCents - a.totalProfitCents),
        totalCount: players.length
    };
}

function computeLeagueCompetitivenessFromPlayers(
    players: PlayerStatsRow[]
): CompetitivenessResult {
    const positiveProfit = players
        .filter((p) => p.totalProfitCents > 0)
        .sort((a, b) => b.totalProfitCents - a.totalProfitCents);
    const totalPositive = positiveProfit.reduce(
        (s, p) => s + p.totalProfitCents,
        0
    );
    if (totalPositive <= 0) {
        return {
            top1ShareOfPositiveProfit: 0,
            top3ShareOfPositiveProfit: 0,
            badge: 'Competitive'
        };
    }
    const top1 = positiveProfit[0]?.totalProfitCents ?? 0;
    const top3 = positiveProfit
        .slice(0, 3)
        .reduce((s, p) => s + p.totalProfitCents, 0);
    const top1Share = top1 / totalPositive;
    const top3Share = top3 / totalPositive;
    return {
        top1ShareOfPositiveProfit: top1Share,
        top3ShareOfPositiveProfit: top3Share,
        badge: top1Share > 0.45 ? 'Dominated' : 'Competitive'
    };
}

export async function getSeasonsForFilter(
    groupId: string
): Promise<{ id: string; name: string }[]> {
    const seasons = await prisma.season.findMany({
        where: { groupId },
        orderBy: { startsAt: 'desc' },
        select: { id: true, name: true }
    });
    return seasons;
}

export async function getLeagueStatsOverview(
    groupId: string,
    filters: StatsFilters
): Promise<LeagueStatsOverview> {
    const games = await loadFilteredGames(groupId, filters);
    return computeLeagueStatsOverviewFromGames(games);
}

export async function getLeagueActivityTrend(
    groupId: string,
    filters: StatsFilters,
    limitPoints?: number
): Promise<ActivityTrendPoint[]> {
    const games = await loadFilteredGames(groupId, filters);
    return computeLeagueActivityTrendFromGames(games, filters, limitPoints);
}

export async function getRecentActivity(
    groupId: string,
    filters: StatsFilters,
    limit = 5
): Promise<RecentNightRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    return computeRecentActivityFromGames(games, limit);
}

export async function getRecords(
    groupId: string,
    filters: StatsFilters
): Promise<RecordItem[]> {
    const games = await loadFilteredGames(groupId, filters);
    return computeRecordsFromGames(games);
}

export async function getPlayersLeaderboardStats(
    groupId: string,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number }
): Promise<{ players: PlayerStatsRow[]; totalCount: number }> {
    const games = await loadFilteredGames(groupId, filters);
    return computePlayersLeaderboardFromGames(games, filters, limits);
}

export async function getRollingFormTable(
    groupId: string,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number },
    topN = 10
): Promise<RollingFormRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    const n = filters.rollingNights;
    const lastN = games.slice(-n);
    const previousN = games.slice(-n * 2, -n);

    const flatLast = gamesToFlatRows(lastN);
    const flatPrev = gamesToFlatRows(previousN);

    const byPlayerLast = new Map<string, { buyIn: number; profit: number }>();
    for (const r of flatLast) {
        const cur = byPlayerLast.get(r.playerId) ?? { buyIn: 0, profit: 0 };
        cur.buyIn += r.buyInCents;
        cur.profit += r.profitCents;
        byPlayerLast.set(r.playerId, cur);
    }
    const byPlayerPrev = new Map<string, { buyIn: number; profit: number }>();
    for (const r of flatPrev) {
        const cur = byPlayerPrev.get(r.playerId) ?? { buyIn: 0, profit: 0 };
        cur.buyIn += r.buyInCents;
        cur.profit += r.profitCents;
        byPlayerPrev.set(r.playerId, cur);
    }

    const names = new Map<string, string>();
    for (const r of flatLast) names.set(r.playerId, r.name);

    const rows: RollingFormRow[] = [];
    for (const [playerId, last] of byPlayerLast) {
        const prev = byPlayerPrev.get(playerId);
        const roiLastN =
            last.buyIn > 0 ? last.profit / last.buyIn : null;
        let trend: 'up' | 'down' | 'flat' = 'flat';
        if (prev && prev.buyIn > 0) {
            const roiPrev = prev.profit / prev.buyIn;
            if (roiLastN != null) {
                if (roiLastN > roiPrev) trend = 'up';
                else if (roiLastN < roiPrev) trend = 'down';
            }
        }
        rows.push({
            playerId,
            name: names.get(playerId) ?? '—',
            profitLastN: last.profit,
            roiLastN,
            trendDirection: trend
        });
    }

    rows.sort((a, b) => b.profitLastN - a.profitLastN);
    return rows.slice(0, topN);
}

export async function getSeasonsTable(
    groupId: string,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number }
): Promise<SeasonTableRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    const rows = gamesToFlatRows(games);

    const bySeason = new Map<
        string,
        {
            name: string;
            startsAt: Date;
            endsAt: Date | null;
            games: number;
            totalPot: number;
            byPlayer: Map<
                string,
                { name: string; profitCents: number; buyInCents: number }
            >;
        }
    >();

    const seasonMeta = await prisma.season.findMany({
        where: { groupId },
        select: { id: true, name: true, startsAt: true, endsAt: true }
    });
    for (const s of seasonMeta) {
        bySeason.set(s.id, {
            name: s.name,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            games: 0,
            totalPot: 0,
            byPlayer: new Map()
        });
    }

    let noSeasonPot = 0;
    const noSeasonPlayers = new Map<string, { name: string; profitCents: number; buyInCents: number }>();

    for (const g of games) {
        const pot = g.players.reduce((s, p) => s + p.buyInCents, 0);
        if (g.seasonId && bySeason.has(g.seasonId)) {
            const seg = bySeason.get(g.seasonId)!;
            seg.games += 1;
            seg.totalPot += pot;
            for (const gp of g.players) {
                const cash = gp.cashOutCents ?? 0;
                const profit = cash - gp.buyInCents - gp.adjustmentCents;
                let prec = seg.byPlayer.get(gp.playerId);
                if (!prec)
                    prec = {
                        name: gp.player.name,
                        profitCents: 0,
                        buyInCents: 0
                    };
                prec.profitCents += profit;
                prec.buyInCents += gp.buyInCents;
                seg.byPlayer.set(gp.playerId, prec);
            }
        } else {
            noSeasonPot += pot;
            for (const gp of g.players) {
                const cash = gp.cashOutCents ?? 0;
                const profit = cash - gp.buyInCents - gp.adjustmentCents;
                let prec = noSeasonPlayers.get(gp.playerId);
                if (!prec)
                    prec = {
                        name: gp.player.name,
                        profitCents: 0,
                        buyInCents: 0
                    };
                prec.profitCents += profit;
                prec.buyInCents += gp.buyInCents;
                noSeasonPlayers.set(gp.playerId, prec);
            }
        }
    }

    const result: SeasonTableRow[] = [];

    for (const [seasonId, seg] of bySeason) {
        if (seg.games === 0) continue;
        const players = [...seg.byPlayer.values()];
        const byProfit = [...players].sort((a, b) => b.profitCents - a.profitCents);
        const byRoi = [...players]
            .filter((p) => p.buyInCents > 0)
            .sort(
                (a, b) =>
                    b.profitCents / b.buyInCents - a.profitCents / a.buyInCents
            );
        const topWinner = byProfit[0];
        const bestRoi = byRoi[0];
        result.push({
            seasonId,
            name: seg.name,
            startsAt: seg.startsAt,
            endsAt: seg.endsAt,
            nights: seg.games,
            totalPotCents: seg.totalPot,
            avgPotCents: Math.round(seg.totalPot / seg.games),
            playersParticipated: seg.byPlayer.size,
            mostProfitablePlayerName: topWinner?.name ?? null,
            mostProfitablePlayerId:
                topWinner
                    ? [...seg.byPlayer.entries()].find(
                          ([_, p]) => p.name === topWinner.name
                      )?.[0] ?? null
                    : null,
            mostProfitableProfitCents: topWinner?.profitCents ?? null,
            bestRoiPlayerName: bestRoi?.name ?? null,
            bestRoiPlayerId:
                bestRoi
                    ? [...seg.byPlayer.entries()].find(
                          ([_, p]) => p.name === bestRoi.name
                      )?.[0] ?? null
                    : null,
            bestRoi:
                bestRoi && bestRoi.buyInCents > 0
                    ? bestRoi.profitCents / bestRoi.buyInCents
                    : null
        });
    }

    result.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    return result;
}

export async function getNightsTable(
    groupId: string,
    filters: StatsFilters
): Promise<NightTableRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    const result: NightTableRow[] = [];

    for (const g of games) {
        const potCents = g.players.reduce((s, p) => s + p.buyInCents, 0);
        const withProfit = g.players.map((gp) => {
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            return {
                playerId: gp.player.id,
                name: gp.player.name,
                profitCents: profit,
                buyInCents: gp.buyInCents
            };
        });
        const sorted = [...withProfit].sort((a, b) => b.profitCents - a.profitCents);
        const winner = sorted[0];
        const loser = sorted[sorted.length - 1];
        const rebuysEstimate = g.players.reduce(
            (s, p) => s + Math.max(0, Math.ceil(p.buyInCents / 100) - 1),
            0
        );

        result.push({
            gameId: g.id,
            date: g.scheduledAt,
            status: g.status,
            potCents,
            playersCount: g.players.length,
            biggestWinnerName: winner?.name ?? null,
            biggestWinnerPlayerId: winner?.playerId ?? null,
            biggestWinnerProfitCents: winner?.profitCents ?? null,
            biggestLoserName: loser?.name ?? null,
            biggestLoserPlayerId: loser?.playerId ?? null,
            biggestLoserLossCents:
                loser && loser.profitCents < 0 ? Math.abs(loser.profitCents) : null,
            rebuysCount: rebuysEstimate
        });
    }

    result.sort((a, b) => b.date.getTime() - a.date.getTime());
    return result;
}

export async function getNightDetailStats(
    groupId: string,
    nightId: string
): Promise<{
    gameId: string;
    date: Date;
    status: string;
    potCents: number;
    playersCount: number;
    results: {
        playerId: string;
        name: string;
        buyInCents: number;
        cashOutCents: number;
        profitCents: number;
        roi: number | null;
        tableShare: number;
    }[];
    biggestWinner: { name: string; playerId: string; profitCents: number } | null;
    biggestLoser: { name: string; playerId: string; profitCents: number } | null;
    highestRoi: { name: string; playerId: string; roi: number } | null;
} | null> {
    const game = await prisma.game.findFirst({
        where: { id: nightId, groupId },
        include: {
            players: { include: { player: true } }
        }
    });
    if (!game) return null;

    const potCents = game.players.reduce((s, p) => s + p.buyInCents, 0);
    const results = game.players.map((gp) => {
        const cash = gp.cashOutCents ?? 0;
        const profit = cash - gp.buyInCents - gp.adjustmentCents;
        const roi = gp.buyInCents > 0 ? profit / gp.buyInCents : null;
        const tableShare = potCents > 0 ? (gp.buyInCents / potCents) * 100 : 0;
        return {
            playerId: gp.player.id,
            name: gp.player.name,
            buyInCents: gp.buyInCents,
            cashOutCents: cash,
            profitCents: profit,
            roi,
            tableShare
        };
    });

    const sorted = [...results].sort((a, b) => b.profitCents - a.profitCents);
    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];
    const withRoi = results.filter((r) => r.roi != null);
    const highestRoiEntry =
        withRoi.length > 0
            ? withRoi.sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))[0]
            : null;

    return {
        gameId: game.id,
        date: game.scheduledAt,
        status: game.status,
        potCents,
        playersCount: game.players.length,
        results,
        biggestWinner: winner
            ? {
                  name: winner.name,
                  playerId: winner.playerId,
                  profitCents: winner.profitCents
              }
            : null,
        biggestLoser:
            loser && loser.profitCents < 0
                ? {
                      name: loser.name,
                      playerId: loser.playerId,
                      profitCents: loser.profitCents
                  }
                : null,
        highestRoi: highestRoiEntry
            ? {
                  name: highestRoiEntry.name,
                  playerId: highestRoiEntry.playerId,
                  roi: highestRoiEntry.roi!
              }
            : null
    };
}

export async function getSeasonDetail(
    groupId: string,
    seasonId: string,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number }
): Promise<{
    seasonId: string;
    name: string;
    startsAt: Date;
    endsAt: Date | null;
    totalNights: number;
    totalPotCents: number;
    avgPotCents: number;
    playersCount: number;
    topRoi: PlayerStatsRow[];
    topProfit: PlayerStatsRow[];
    topScore: PlayerStatsRow[];
    topAction: PlayerStatsRow[];
    trend: ActivityTrendPoint[];
} | null> {
    const season = await prisma.season.findFirst({
        where: { id: seasonId, groupId }
    });
    if (!season) return null;

    const filtersForSeason = { ...filters, seasonId };
    const games = await loadFilteredGames(groupId, filtersForSeason);
    const rows = gamesToFlatRows(games);

    const byPlayer = new Map<
        string,
        {
            name: string;
            totalBuyInCents: number;
            totalCashOutCents: number;
            totalGames: number;
            nightsInProfit: number;
            bestNightProfit: number;
            worstNightLoss: number;
            potWeightedScoreSum: number;
        }
    >();

    for (const r of rows) {
        let rec = byPlayer.get(r.playerId);
        if (!rec) {
            rec = {
                name: r.name,
                totalBuyInCents: 0,
                totalCashOutCents: 0,
                totalGames: 0,
                nightsInProfit: 0,
                bestNightProfit: -Infinity,
                worstNightLoss: Infinity,
                potWeightedScoreSum: 0
            };
            byPlayer.set(r.playerId, rec);
        }
        rec.totalBuyInCents += r.buyInCents;
        rec.totalCashOutCents += r.cashOutCents;
        rec.totalGames += 1;
        if (r.profitCents > 0) rec.nightsInProfit += 1;
        if (r.profitCents > rec.bestNightProfit) rec.bestNightProfit = r.profitCents;
        if (r.profitCents < rec.worstNightLoss) rec.worstNightLoss = r.profitCents;
        if (r.potCents > 0)
            rec.potWeightedScoreSum +=
                (r.profitCents / 100) * Math.sqrt(r.potCents / 100);
    }

    const { minNightsPlayed, minTotalBuyInCents } = getEligibilityThresholds(
        filters,
        limits
    );
    const playerRows: PlayerStatsRow[] = [];
    for (const [playerId, rec] of byPlayer) {
        const totalProfitCents = rec.totalCashOutCents - rec.totalBuyInCents;
        playerRows.push({
            playerId,
            name: rec.name,
            nightsPlayed: rec.totalGames,
            totalBuyInCents: rec.totalBuyInCents,
            totalCashOutCents: rec.totalCashOutCents,
            totalProfitCents: totalProfitCents,
            roi:
                rec.totalBuyInCents > 0
                    ? totalProfitCents / rec.totalBuyInCents
                    : null,
            performanceScore:
                rec.totalBuyInCents > 0
                    ? seasonScore(totalProfitCents, rec.totalBuyInCents)
                    : null,
            winRate: rec.totalGames > 0 ? rec.nightsInProfit / rec.totalGames : 0,
            bestNightProfitCents:
                rec.bestNightProfit > -Infinity ? rec.bestNightProfit : null,
            worstNightLossCents:
                rec.worstNightLoss < Infinity ? rec.worstNightLoss : null,
            meetsEligibility:
                rec.totalGames >= minNightsPlayed &&
                rec.totalBuyInCents >= minTotalBuyInCents
        });
    }

    const topRoi = [...playerRows]
        .filter((p) => p.roi != null)
        .sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))
        .slice(0, 5);
    const topProfit = [...playerRows]
        .sort((a, b) => b.totalProfitCents - a.totalProfitCents)
        .slice(0, 5);
    const topScore = [...playerRows]
        .filter((p) => p.performanceScore != null)
        .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
        .slice(0, 5);
    const topAction = [...playerRows]
        .sort((a, b) => b.totalBuyInCents - a.totalBuyInCents)
        .slice(0, 5);

    const trend: ActivityTrendPoint[] = games.map((g) => ({
        date: g.scheduledAt.toISOString().slice(0, 10),
        potCents: g.players.reduce((s, p) => s + p.buyInCents, 0),
        playersCount: g.players.length
    }));

    return {
        seasonId: season.id,
        name: season.name,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        totalNights: games.length,
        totalPotCents: games.reduce(
            (s, g) => s + g.players.reduce((a, p) => a + p.buyInCents, 0),
            0
        ),
        avgPotCents:
            games.length > 0
                ? Math.round(
                      games.reduce(
                          (s, g) =>
                              s + g.players.reduce((a, p) => a + p.buyInCents, 0),
                          0
                      ) / games.length
                  )
                : 0,
        playersCount: byPlayer.size,
        topRoi,
        topProfit,
        topScore,
        topAction,
        trend
    };
}

export async function getLeagueCompetitiveness(
    groupId: string,
    filters: StatsFilters
): Promise<CompetitivenessResult> {
    const { players } = await getPlayersLeaderboardStats(
        groupId,
        filters,
        getLeaderboardLimits()
    );
    const positiveProfit = players
        .filter((p) => p.totalProfitCents > 0)
        .sort((a, b) => b.totalProfitCents - a.totalProfitCents);
    const totalPositive = positiveProfit.reduce(
        (s, p) => s + p.totalProfitCents,
        0
    );
    if (totalPositive <= 0) {
        return {
            top1ShareOfPositiveProfit: 0,
            top3ShareOfPositiveProfit: 0,
            badge: 'Competitive'
        };
    }
    const top1 = positiveProfit[0]?.totalProfitCents ?? 0;
    const top3 = positiveProfit
        .slice(0, 3)
        .reduce((s, p) => s + p.totalProfitCents, 0);
    const top1Share = top1 / totalPositive;
    const top3Share = top3 / totalPositive;
    return {
        top1ShareOfPositiveProfit: top1Share,
        top3ShareOfPositiveProfit: top3Share,
        badge: top1Share > 0.45 ? 'Dominated' : 'Competitive'
    };
}

/** Load games once and derive all overview data (one DB round-trip to avoid pool exhaustion). */
export async function getStatsOverviewData(
    groupId: string,
    filters: StatsFilters,
    limits: { minNightsPlayed: number; minTotalBuyInCents: number }
): Promise<{
    overview: LeagueStatsOverview;
    trend: ActivityTrendPoint[];
    recentActivity: RecentNightRow[];
    records: RecordItem[];
    leaderboardData: { players: PlayerStatsRow[]; totalCount: number };
    competitiveness: CompetitivenessResult;
}> {
    const games = await loadFilteredGames(groupId, filters);
    const overview = computeLeagueStatsOverviewFromGames(games);
    const trend = computeLeagueActivityTrendFromGames(games, filters);
    const recentActivity = computeRecentActivityFromGames(games, 5);
    const records = computeRecordsFromGames(games);
    const leaderboardData = computePlayersLeaderboardFromGames(games, filters, limits);
    const competitiveness = computeLeagueCompetitivenessFromPlayers(leaderboardData.players);
    return {
        overview,
        trend,
        recentActivity,
        records,
        leaderboardData,
        competitiveness
    };
}

export async function getPlayersDistributions(
    groupId: string,
    filters: StatsFilters
): Promise<{
    profitBuckets: DistributionBucket[];
    roiBuckets: DistributionBucket[];
    percentProfitable: number;
}> {
    const { players } = await getPlayersLeaderboardStats(
        groupId,
        filters,
        getLeaderboardLimits()
    );
    const profitableCount = players.filter((p) => p.totalProfitCents > 0).length;
    const percentProfitable =
        players.length > 0 ? (profitableCount / players.length) * 100 : 0;

    // Simple buckets for profit (in dollars)
    const profitValues = players.map((p) => p.totalProfitCents / 100);
    const minP = Math.min(...profitValues);
    const maxP = Math.max(...profitValues);
    const bucketSize = Math.max(1, Math.ceil((maxP - minP) / 10) || 1);
    const profitMap = new Map<string, number>();
    for (const p of profitValues) {
        const bucket = Math.floor(p / bucketSize) * bucketSize;
        const key = `$${bucket}`;
        profitMap.set(key, (profitMap.get(key) ?? 0) + 1);
    }
    const profitBuckets: DistributionBucket[] = [...profitMap.entries()].map(
        ([label, count]) => ({ label, count })
    );

    const roiValues = players
        .filter((p) => p.roi != null)
        .map((p) => (p.roi ?? 0) * 100);
    const minR = roiValues.length ? Math.min(...roiValues) : 0;
    const maxR = roiValues.length ? Math.max(...roiValues) : 0;
    const roiBucketSize = Math.max(1, Math.ceil((maxR - minR) / 10) || 1);
    const roiMap = new Map<string, number>();
    for (const r of roiValues) {
        const bucket = Math.floor(r / roiBucketSize) * roiBucketSize;
        const key = `${bucket}%`;
        roiMap.set(key, (roiMap.get(key) ?? 0) + 1);
    }
    const roiBuckets: DistributionBucket[] = [...roiMap.entries()].map(
        ([label, count]) => ({ label, count })
    );

    return { profitBuckets, roiBuckets, percentProfitable };
}

export async function getStreaks(
    groupId: string,
    filters: StatsFilters
): Promise<{
    playerId: string;
    name: string;
    currentWinStreak: number;
    currentLosingStreak: number;
    longestWinStreak: number;
    longestLosingStreak: number;
}[]> {
    const games = await loadFilteredGames(groupId, filters);
    const rows = gamesToFlatRows(games);
    const gameOrder = [...new Set(rows.map((r) => r.gameId))];
    const gameIndex = new Map(gameOrder.map((id, i) => [id, i]));

    const byPlayer = new Map<
        string,
        { name: string; profits: number[]; gameIds: string[] }
    >();
    for (const r of rows) {
        if (!byPlayer.has(r.playerId)) {
            byPlayer.set(r.playerId, {
                name: r.name,
                profits: [],
                gameIds: []
            });
        }
        const rec = byPlayer.get(r.playerId)!;
        rec.profits.push(r.profitCents);
        rec.gameIds.push(r.gameId);
    }

    const result: {
        playerId: string;
        name: string;
        currentWinStreak: number;
        currentLosingStreak: number;
        longestWinStreak: number;
        longestLosingStreak: number;
    }[] = [];

    for (const [playerId, rec] of byPlayer) {
        const ordered = rec.gameIds
            .map((id, i) => ({ gameId: id, profit: rec.profits[i]! }))
            .sort((a, b) => gameIndex.get(a.gameId)! - gameIndex.get(b.gameId)!);
        let curWin = 0;
        let curLoss = 0;
        let maxWin = 0;
        let maxLoss = 0;
        for (const { profit } of ordered) {
            if (profit > 0) {
                curWin++;
                curLoss = 0;
                if (curWin > maxWin) maxWin = curWin;
            } else if (profit < 0) {
                curLoss++;
                curWin = 0;
                if (curLoss > maxLoss) maxLoss = curLoss;
            } else {
                curWin = 0;
                curLoss = 0;
            }
        }
        result.push({
            playerId,
            name: rec.name,
            currentWinStreak: curWin,
            currentLosingStreak: curLoss,
            longestWinStreak: maxWin,
            longestLosingStreak: maxLoss
        });
    }

    return result;
}

/** Phase 3: Skill rating (Elo-style approximation, computed on read). Experimental. */
export async function getSkillRatings(
    groupId: string,
    filters: StatsFilters
): Promise<SkillRatingRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    if (games.length === 0) return [];

    const K = 32;
    const ratings = new Map<string, number>();
    const names = new Map<string, string>();

    for (const g of games) {
        const withProfit = g.players.map((gp) => {
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            return { playerId: gp.player.id, name: gp.player.name, profitCents: profit };
        });
        withProfit.sort((a, b) => b.profitCents - a.profitCents);
        const n = withProfit.length;
        const avgRating =
            n > 0
                ? withProfit.reduce(
                      (s, p) => s + (ratings.get(p.playerId) ?? 1500),
                      0
                  ) / n
                : 1500;

        for (let i = 0; i < withProfit.length; i++) {
            const p = withProfit[i]!;
            names.set(p.playerId, p.name);
            const current = ratings.get(p.playerId) ?? 1500;
            const rank = i + 1;
            const expected = 1 - (rank - 1) / n;
            const actual = p.profitCents > 0 ? 1 : p.profitCents < 0 ? 0 : 0.5;
            const newRating = current + K * (actual - expected);
            ratings.set(p.playerId, newRating);
        }
    }

    const sorted = [...ratings.entries()].sort((a, b) => b[1] - a[1]);
    const lastN = filters.rollingNights;
    const lastGames = games.slice(-lastN);
    const changeMap = new Map<string, number>();
    for (const g of lastGames) {
        for (const gp of g.players) {
            changeMap.set(gp.playerId, (changeMap.get(gp.playerId) ?? 0) + 1);
        }
    }

    return sorted.map(([playerId, rating], i) => ({
        playerId,
        name: names.get(playerId) ?? '—',
        rating: Math.round(rating),
        changeLastN: 0
    }));
}

/** Phase 3: Deterministic league narrative */
export async function getInsightsNarrative(
    groupId: string,
    filters: StatsFilters
): Promise<InsightsNarrative> {
    const limits = getLeaderboardLimits();
    const [overview, { players }, competitiveness] = await Promise.all([
        getLeagueStatsOverview(groupId, filters),
        getPlayersLeaderboardStats(groupId, filters, limits),
        getLeagueCompetitiveness(groupId, filters)
    ]);

    const byRoi = [...players].filter((p) => p.roi != null).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
    const byProfit = [...players].sort((a, b) => b.totalProfitCents - a.totalProfitCents);
    const byScore = [...players]
        .filter((p) => p.performanceScore != null)
        .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0));

    const roiLeader = byRoi[0]?.name ?? null;
    const profitLeader = byProfit[0]?.name ?? null;
    const scoreLeader = byScore[0]?.name ?? null;

    const last10 = players.slice(0, 10);
    const hottestLast10 = last10.length > 0 ? last10[0]?.name ?? null : null;

    let potTrend = 'stable';
    if (overview.averagePotLast10Cents != null && overview.averagePotCents > 0) {
        if (overview.averagePotLast10Cents > overview.averagePotCents * 1.1)
            potTrend = 'up';
        else if (overview.averagePotLast10Cents < overview.averagePotCents * 0.9)
            potTrend = 'down';
    }

    const competitivenessText =
        competitiveness.badge === 'Dominated'
            ? `Top player holds ${Math.round(competitiveness.top1ShareOfPositiveProfit * 100)}% of positive profit (dominated).`
            : 'Profit is spread across the field (competitive).';

    const attendanceText = `${overview.uniquePlayersAllTime} unique players; avg ${overview.averagePlayersPerNight} per night.`;

    const summary = [
        profitLeader ? `Leading by profit: ${profitLeader}.` : '',
        roiLeader ? `Best ROI: ${roiLeader}.` : '',
        scoreLeader ? `Best performer (score): ${scoreLeader}.` : '',
        hottestLast10 ? `Hottest recently: ${hottestLast10}.` : '',
        `Pot trend: ${potTrend}.`,
        competitivenessText,
        attendanceText
    ]
        .filter(Boolean)
        .join(' ');

    return {
        summary,
        roiLeader,
        profitLeader,
        scoreLeader,
        hottestLast10,
        potTrend,
        competitiveness: competitivenessText,
        attendance: attendanceText
    };
}

/** Phase 3: Heater index – nights where ROI > X and buy-in <= Y */
const HEATER_ROI_THRESHOLD = 0.5;
const HEATER_MAX_BUY_IN_CENTS = 2000;

export async function getHeaterIndex(
    groupId: string,
    filters: StatsFilters
): Promise<HeaterIndexRow[]> {
    const games = await loadFilteredGames(groupId, filters);
    const countByPlayer = new Map<string, { name: string; count: number }>();

    for (const g of games) {
        for (const gp of g.players) {
            if (gp.buyInCents > HEATER_MAX_BUY_IN_CENTS) continue;
            const cash = gp.cashOutCents ?? 0;
            const profit = cash - gp.buyInCents - gp.adjustmentCents;
            const roi = gp.buyInCents > 0 ? profit / gp.buyInCents : 0;
            if (roi >= HEATER_ROI_THRESHOLD) {
                const cur = countByPlayer.get(gp.playerId) ?? {
                    name: gp.player.name,
                    count: 0
                };
                cur.count += 1;
                countByPlayer.set(gp.playerId, cur);
            }
        }
    }

    return [...countByPlayer.entries()]
        .map(([playerId, { name, count }]) => ({
            playerId,
            name,
            heaterNightCount: count
        }))
        .sort((a, b) => b.heaterNightCount - a.heaterNightCount);
}
