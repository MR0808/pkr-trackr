import { getDefaultGroupId } from '@/lib/default-group';
import { parseStatsFiltersFromSearchParams } from '@/schemas/statsFilters';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { getNightsTable, getSeasonsForFilter } from '@/lib/stats-queries';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import { NightsStatsView } from '@/components/stats/NightsStatsView';

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StatsNightsPage({ searchParams }: Props) {
    const params = await searchParams;
    const filters = parseStatsFiltersFromSearchParams(params);
    const groupId = await getDefaultGroupId();
    const limits = getLeaderboardLimits();

    const [seasonOptions, nightsData] = await Promise.all([
        getSeasonsForFilter(groupId),
        getNightsTable(groupId, filters)
    ]);

    return (
        <div className="container mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Nights
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        All games with pot, players, biggest winner/loser.
                    </p>
                </div>
                <StatsFilters
                    filters={filters}
                    seasonOptions={seasonOptions}
                    defaultMinNights={limits.minNightsPlayed}
                    defaultMinBuyInCents={limits.minTotalBuyInCents}
                />
            </div>

            <NightsStatsView nights={nightsData} filters={filters} />
        </div>
    );
}
