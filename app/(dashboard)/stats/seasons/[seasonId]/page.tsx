import Link from 'next/link';
import { getDefaultGroupId } from '@/lib/default-group';
import { parseStatsFiltersFromSearchParams } from '@/schemas/statsFilters';
import { getSeasonDetail } from '@/lib/stats-queries';
import { getLeaderboardLimits } from '@/lib/leaderboard-config';
import { StatCard } from '@/components/stats/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import { PotTrendChart } from '@/components/stats/PotTrendChart';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

type Props = {
    params: Promise<{ seasonId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SeasonDetailPage({ params, searchParams }: Props) {
    const { seasonId } = await params;
    const search = await searchParams;
    const filters = parseStatsFiltersFromSearchParams(search);
    const groupId = await getDefaultGroupId();
    const limits = getLeaderboardLimits();

    const detail = await getSeasonDetail(
        groupId,
        seasonId,
        filters,
        limits
    );

    if (!detail) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <p className="text-muted-foreground">Season not found.</p>
                <Link
                    href="/stats/seasons"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Seasons
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center gap-4">
                <Link
                    href="/stats/seasons"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Seasons
                </Link>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {detail.name}
                </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Nights"
                    value={detail.totalNights}
                />
                <StatCard
                    title="Total pot"
                    value={formatCurrency(detail.totalPotCents / 100)}
                />
                <StatCard
                    title="Avg pot"
                    value={formatCurrency(detail.avgPotCents / 100)}
                />
                <StatCard
                    title="Players"
                    value={detail.playersCount}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leaderboards</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="roi">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="roi">Best ROI</TabsTrigger>
                            <TabsTrigger value="profit">Top Profit</TabsTrigger>
                            <TabsTrigger value="score">Best Score</TabsTrigger>
                            <TabsTrigger value="action">Most Action</TabsTrigger>
                        </TabsList>
                        <TabsContent value="roi" className="pt-4">
                            <ul className="space-y-2">
                                {detail.topRoi.slice(0, 5).map((p, i) => (
                                    <li key={p.playerId} className="flex justify-between text-sm">
                                        <span>
                                            {i + 1}.{' '}
                                            <Link
                                                href={`/players/${p.playerId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                        </span>
                                        <span>{p.roi != null ? formatPercent(p.roi) : '—'}</span>
                                    </li>
                                ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="profit" className="pt-4">
                            <ul className="space-y-2">
                                {detail.topProfit.slice(0, 5).map((p, i) => (
                                    <li key={p.playerId} className="flex justify-between text-sm">
                                        <span>
                                            {i + 1}.{' '}
                                            <Link
                                                href={`/players/${p.playerId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                        </span>
                                        <span>
                                            {formatCurrencyWithSign(
                                                p.totalProfitCents / 100
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="score" className="pt-4">
                            <ul className="space-y-2">
                                {detail.topScore.slice(0, 5).map((p, i) => (
                                    <li key={p.playerId} className="flex justify-between text-sm">
                                        <span>
                                            {i + 1}.{' '}
                                            <Link
                                                href={`/players/${p.playerId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                        </span>
                                        <span>
                                            {p.performanceScore != null
                                                ? p.performanceScore.toFixed(1)
                                                : '—'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="action" className="pt-4">
                            <ul className="space-y-2">
                                {detail.topAction.slice(0, 5).map((p, i) => (
                                    <li key={p.playerId} className="flex justify-between text-sm">
                                        <span>
                                            {i + 1}.{' '}
                                            <Link
                                                href={`/players/${p.playerId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                        </span>
                                        <span>
                                            {formatCurrency(p.totalBuyInCents / 100)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {detail.trend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pot over time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PotTrendChart data={detail.trend} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
