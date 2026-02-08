import { loadStatsPageData } from '@/actions/stats';
import { StatsPageClient } from '@/components/stats/StatsPageClient';

export default async function StatsPage() {
    const data = await loadStatsPageData();

    return (
        <div className="container mx-auto max-w-7xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Stats
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    All-time and by season. Game dates use scheduled night;
                    podium: 3 pts 1st, 2 pts 2nd, 1 pt 3rd.
                </p>
            </div>

            <StatsPageClient data={data} />
        </div>
    );
}
