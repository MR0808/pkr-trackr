import { Suspense } from 'react';
import { getDefaultGroupId } from '@/lib/default-group';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import { parseStatsFiltersFromSearchParams } from '@/schemas/statsFilters';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { PlayersStatsTable } from '@/components/stats/PlayersStatsTable';
import { getPlayersLeaderboardStats, getSeasonsForFilter, getRollingFormTable } from '@/lib/stats-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StatsPlayersPage({ searchParams }: Props) {
    const params = await searchParams;
    const filters = parseStatsFiltersFromSearchParams(params);
    const groupId = await getDefaultGroupId();
    const limits = getLeaderboardLimits();

    const [seasonOptions, data, rollingForm] = await Promise.all([
        getSeasonsForFilter(groupId),
        getPlayersLeaderboardStats(groupId, filters, limits),
        getRollingFormTable(groupId, filters, limits, 10)
    ]);

    return (
        <div className="container mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Players
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Leaderboard and form. Sort, search, and paginate.
                    </p>
                </div>
                <StatsFilters
                    filters={filters}
                    seasonOptions={seasonOptions}
                    defaultMinNights={limits.minNightsPlayed}
                    defaultMinBuyInCents={limits.minTotalBuyInCents}
                />
            </div>

            <Suspense fallback={<PlayersTableSkeleton />}>
                <PlayersStatsTable
                    initialData={data}
                    filters={filters}
                    groupId={groupId}
                    rollingForm={rollingForm}
                />
            </Suspense>
        </div>
    );
}

function PlayersTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
