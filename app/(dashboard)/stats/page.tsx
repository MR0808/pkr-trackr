import { loadStatsPageData } from '@/actions/stats';
import { StatsPageClient } from '@/components/stats/StatsPageClient';
import { Card, CardContent } from '@/components/ui/card';

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

            {data ? (
                <StatsPageClient data={data} />
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
