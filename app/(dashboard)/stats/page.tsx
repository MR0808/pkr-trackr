import { getDefaultGroupId } from '@/lib/default-group';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import { parseStatsFiltersFromSearchParams } from '@/schemas/statsFilters';
import { getSeasonsForFilter, getStatsOverviewData } from '@/lib/stats-queries';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { StatsOverviewClient } from '@/components/stats/StatsOverviewClient';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StatsPage({ searchParams }: Props) {
    const params = await searchParams;
    const filters = parseStatsFiltersFromSearchParams(params);
    const groupId = await getDefaultGroupId();
    const limits = getLeaderboardLimits();

    const [seasonOptions, overviewData] = await Promise.all([
        getSeasonsForFilter(groupId),
        getStatsOverviewData(groupId, filters, limits)
    ]);
    const {
        overview,
        trend,
        recentActivity,
        records,
        leaderboardData,
        competitiveness
    } = overviewData;

    const hasData = overview.totalNights > 0;

    return (
        <div className="container mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Overview
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        League summary, recent activity, leaderboard snapshot,
                        trend, and records.
                    </p>
                </div>
                <StatsFilters
                    filters={filters}
                    seasonOptions={seasonOptions}
                    defaultMinNights={limits.minNightsPlayed}
                    defaultMinBuyInCents={limits.minTotalBuyInCents}
                />
            </div>

            {hasData ? (
                <StatsOverviewClient
                    overview={overview}
                    recentActivity={recentActivity}
                    trend={trend}
                    records={records}
                    leaderboardSnapshot={leaderboardData.players}
                    competitiveness={competitiveness}
                    topN={filters.topN}
                />
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-lg font-medium">No stats yet</p>
                        <p className="text-sm text-muted-foreground">
                            Close at least one game to see stats.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
