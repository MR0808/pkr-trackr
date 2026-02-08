'use client';

import { useMemo, useState } from 'react';
import { StatsSummary } from '@/components/stats/StatsSummary';
import { StatsAwardsSection } from '@/components/stats/StatsAwardsSection';
import { StatsLeaderboards } from '@/components/stats/StatsLeaderboards';
import { StatsBySeason } from '@/components/stats/StatsBySeason';
import { LeagueHealthOverview } from '@/components/stats/LeagueHealthOverview';
import { ProfitDistributionChart } from '@/components/stats/ProfitDistributionChart';
import type { StatsPageData, StatsAwards, SeasonSummary, SeasonPlayerRow } from '@/types/stats';

function buildSeasonAwards(season: SeasonSummary): StatsAwards {
    const players = season.players;
    const byProfit = [...players].sort((a, b) => b.totalProfitCents - a.totalProfitCents);
    const byROI = [...players].filter((p) => p.roi != null).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
    const byScore = [...players].filter((p) => p.seasonScore != null).sort((a, b) => (b.seasonScore ?? 0) - (a.seasonScore ?? 0));
    const byBuyIn = [...players].sort((a, b) => b.totalBuyInCents - a.totalBuyInCents);
    const byPodium = [...players].sort((a, b) => b.podiumPoints - a.podiumPoints);
    const byNightsWon = [...players].sort((a, b) => b.nightsWon - a.nightsWon);
    const winRateCandidates = players.filter((p) => p.totalGames >= 5);
    const byWinRate = [...winRateCandidates].sort((a, b) => b.winRate - a.winRate);

    return {
        bestSeason: null,
        bestPlayer: byROI[0] ? { name: byROI[0].name, playerId: byROI[0].playerId, roi: byROI[0].roi!, seasonName: season.name } : null,
        bestPerformer: byScore[0] ? { name: byScore[0].name, playerId: byScore[0].playerId, seasonScore: byScore[0].seasonScore!, seasonName: season.name } : null,
        topWinner: byProfit[0] ? { name: byProfit[0].name, playerId: byProfit[0].playerId, totalProfitCents: byProfit[0].totalProfitCents } : null,
        mostAction: byBuyIn[0] ? { name: byBuyIn[0].name, playerId: byBuyIn[0].playerId, totalBuyInCents: byBuyIn[0].totalBuyInCents } : null,
        podiumKing: byPodium[0] ? { name: byPodium[0].name, playerId: byPodium[0].playerId, podiumPoints: byPodium[0].podiumPoints } : null,
        nightsWonLeader: byNightsWon[0] ? { name: byNightsWon[0].name, playerId: byNightsWon[0].playerId, nightsWon: byNightsWon[0].nightsWon } : null,
        winRateLeader: byWinRate[0] ? { name: byWinRate[0].name, playerId: byWinRate[0].playerId, winRate: byWinRate[0].winRate, games: byWinRate[0].totalGames } : null
    };
}

export function StatsPageClient({ data }: { data: StatsPageData }) {
    const [scope, setScope] = useState<'all' | string>('all');

    const summary = useMemo(() => {
        if (scope === 'all') {
            return {
                totalGames: data.allTime.totalGames,
                totalBuyInCents: data.allTime.totalBuyInCents,
                totalCashOutCents: data.allTime.totalCashOutCents,
                totalProfitCents: data.allTime.totalProfitCents
            };
        }
        const season = data.seasons.find((s) => s.seasonId === scope);
        if (!season) return data.allTime;
        return {
            totalGames: season.totalGames,
            totalBuyInCents: season.totalBuyInCents,
            totalCashOutCents: season.totalCashOutCents,
            totalProfitCents: season.totalProfitCents
        };
    }, [data, scope]);

    const awards = useMemo(() => {
        if (scope === 'all') return data.awards;
        const season = data.seasons.find((s) => s.seasonId === scope);
        if (!season) return data.awards;
        return buildSeasonAwards(season);
    }, [data, scope]);

    const players = useMemo(() => {
        if (scope === 'all') return data.allTime.players;
        const season = data.seasons.find((s) => s.seasonId === scope);
        if (!season) return data.allTime.players;
        return season.players as (SeasonPlayerRow & { nightsInProfit?: number; consistency?: number })[];
    }, [data, scope]);

    const scopeLabel = scope === 'all' ? 'All time' : (data.seasons.find((s) => s.seasonId === scope)?.name ?? 'All time');

    return (
        <div className="min-w-0 space-y-6 sm:space-y-8">
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                <label
                    className="shrink-0 text-sm font-medium text-muted-foreground"
                    htmlFor="stats-scope"
                >
                    Scope
                </label>
                <select
                    id="stats-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="all">All time</option>
                    {data.seasons.map((s) => (
                        <option key={s.seasonId} value={s.seasonId}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            {scope === 'all' && (
                <>
                    <LeagueHealthOverview
                        leagueHealth={data.leagueHealth}
                        awards={data.awards}
                    />
                    <ProfitDistributionChart
                        profitable={data.profitDistribution.profitable}
                        nonProfitable={data.profitDistribution.nonProfitable}
                    />
                </>
            )}
            <StatsSummary summary={summary} />
            <StatsAwardsSection awards={awards} />
            <StatsLeaderboards players={players} scopeLabel={scopeLabel} />
            {scope === 'all' && <StatsBySeason seasons={data.seasons} />}
        </div>
    );
}
