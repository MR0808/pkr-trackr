'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import type {
    LeagueStatsOverview,
    RecentNightRow,
    ActivityTrendPoint,
    RecordItem,
    PlayerStatsRow
} from '@/types/stats';
import type { CompetitivenessResult } from '@/types/stats';
import { StatCard } from './StatCard';
import { ChartContainer } from './ChartContainer';

type Props = {
    overview: LeagueStatsOverview;
    recentActivity: RecentNightRow[];
    trend: ActivityTrendPoint[];
    records: RecordItem[];
    leaderboardSnapshot: PlayerStatsRow[];
    competitiveness: CompetitivenessResult | null;
    topN: number;
};

export function StatsOverviewClient({
    overview,
    recentActivity,
    trend,
    records,
    leaderboardSnapshot,
    competitiveness,
    topN
}: Props) {
    const byRoi = [...leaderboardSnapshot]
        .filter((p) => p.roi != null)
        .sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))
        .slice(0, topN);
    const byProfit = [...leaderboardSnapshot]
        .sort((a, b) => b.totalProfitCents - a.totalProfitCents)
        .slice(0, topN);
    const byScore = [...leaderboardSnapshot]
        .filter((p) => p.performanceScore != null)
        .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
        .slice(0, topN);
    const byAction = [...leaderboardSnapshot]
        .sort((a, b) => b.totalBuyInCents - a.totalBuyInCents)
        .slice(0, topN);

    return (
        <div className="min-w-0 space-y-6 sm:space-y-8">
            <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    League summary
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <StatCard
                        title="Total nights"
                        value={overview.totalNights}
                    />
                    <StatCard
                        title="Total pot played"
                        value={formatCurrency(overview.totalPotCents / 100)}
                    />
                    <StatCard
                        title="Average pot"
                        value={formatCurrency(overview.averagePotCents / 100)}
                        subtitle={
                            overview.averagePotLast10Cents != null
                                ? `Last 10: ${formatCurrency(overview.averagePotLast10Cents / 100)}`
                                : undefined
                        }
                    />
                    <StatCard
                        title="Largest pot"
                        value={formatCurrency(overview.largestPotCents / 100)}
                    />
                    <StatCard
                        title="Unique players"
                        value={overview.uniquePlayersAllTime}
                        subtitle={
                            overview.uniquePlayersLast30Days > 0
                                ? `Last 30d: ${overview.uniquePlayersLast30Days}`
                                : undefined
                        }
                    />
                    <StatCard
                        title="Avg players/night"
                        value={overview.averagePlayersPerNight.toFixed(1)}
                    />
                </div>
            </section>

            {competitiveness && (
                <Card>
                    <CardContent className="flex flex-row items-center justify-between py-4">
                        <div>
                            <p className="text-sm font-medium">
                                League competitiveness
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Top 1 holds{' '}
                                {Math.round(
                                    competitiveness.top1ShareOfPositiveProfit * 100
                                )}
                                % of positive profit
                            </p>
                        </div>
                        <Badge
                            variant={
                                competitiveness.badge === 'Dominated'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                        >
                            {competitiveness.badge}
                        </Badge>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent activity</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Last 5 nights
                        </p>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No recent nights
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {recentActivity.map((night) => (
                                    <li
                                        key={night.gameId}
                                        className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
                                    >
                                        <Link
                                            href={`/games/${night.gameId}/results`}
                                            className="font-medium hover:underline"
                                        >
                                            {format(night.date, 'MMM d, yyyy')}
                                        </Link>
                                        <span className="text-muted-foreground text-sm">
                                            {formatCurrency(night.potCents / 100)} · {night.playersCount} players
                                        </span>
                                        <span className="w-full text-sm sm:w-auto">
                                            Winner:{' '}
                                            <Link
                                                href={`/players/${night.biggestWinnerPlayerId}`}
                                                className="hover:underline"
                                            >
                                                {night.biggestWinnerName}
                                            </Link>{' '}
                                            (
                                            {formatCurrencyWithSign(
                                                night.biggestWinnerProfitCents / 100
                                            )}
                                            )
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Leaderboard snapshot</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Top {topN} · <Link href="/stats/players" className="font-medium hover:underline">View full leaderboard</Link>
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="skill" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="skill">Best Skill</TabsTrigger>
                                <TabsTrigger value="winner">Top Winner</TabsTrigger>
                                <TabsTrigger value="performer">Performer</TabsTrigger>
                                <TabsTrigger value="action">Most Action</TabsTrigger>
                            </TabsList>
                            <TabsContent value="skill" className="pt-3">
                                <SnapshotList
                                    items={byRoi.map((p) => (
                                        <Link
                                            key={p.playerId}
                                            href={`/players/${p.playerId}`}
                                            className="hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                    ))}
                                    values={byRoi.map((p) =>
                                        p.roi != null ? formatPercent(p.roi) : '—'
                                    )}
                                    viewFullHref="/stats/players?sort=roi"
                                />
                            </TabsContent>
                            <TabsContent value="winner" className="pt-3">
                                <SnapshotList
                                    items={byProfit.map((p) => (
                                        <Link
                                            key={p.playerId}
                                            href={`/players/${p.playerId}`}
                                            className="hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                    ))}
                                    values={byProfit.map((p) =>
                                        formatCurrencyWithSign(
                                            p.totalProfitCents / 100
                                        )
                                    )}
                                    viewFullHref="/stats/players"
                                />
                            </TabsContent>
                            <TabsContent value="performer" className="pt-3">
                                <SnapshotList
                                    items={byScore.map((p) => (
                                        <Link
                                            key={p.playerId}
                                            href={`/players/${p.playerId}`}
                                            className="hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                    ))}
                                    values={byScore.map((p) =>
                                        p.performanceScore != null
                                            ? p.performanceScore.toFixed(1)
                                            : '—'
                                    )}
                                    viewFullHref="/stats/players?sort=score"
                                />
                            </TabsContent>
                            <TabsContent value="action" className="pt-3">
                                <SnapshotList
                                    items={byAction.map((p) => (
                                        <Link
                                            key={p.playerId}
                                            href={`/players/${p.playerId}`}
                                            className="hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                    ))}
                                    values={byAction.map((p) =>
                                        formatCurrency(p.totalBuyInCents / 100)
                                    )}
                                    viewFullHref="/stats/players?sort=action"
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {trend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Night pot over time</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Last {Math.min(50, trend.length)} nights
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer className="h-[280px] w-full min-w-0">
                            {(width, height) => (
                                <LineChart
                                    width={width}
                                    height={height}
                                    data={trend.map((t) => ({
                                        ...t,
                                        pot: t.potCents / 100
                                    }))}
                                    margin={{
                                        top: 5,
                                        right: 10,
                                        left: 0,
                                        bottom: 5
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-muted"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(v) =>
                                            format(new Date(v), 'MMM d')
                                        }
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [
                                            value != null ? formatCurrency(value) : '—',
                                            'Pot'
                                        ]}
                                        labelFormatter={(label) =>
                                            format(
                                                new Date(label),
                                                'MMM d, yyyy'
                                            )
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pot"
                                        name="Pot"
                                        stroke="oklch(0.55 0.22 25)"
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                </LineChart>
                            )}
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {records.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Records</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            All-time
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {records.map((r, i) => (
                                <li
                                    key={i}
                                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {r.label}
                                    </span>
                                    <span className="font-medium">
                                        {r.playerId ? (
                                            <Link
                                                href={`/players/${r.playerId}`}
                                                className="hover:underline"
                                            >
                                                {r.value}
                                                {r.playerName
                                                    ? ` (${r.playerName})`
                                                    : ''}
                                            </Link>
                                        ) : r.gameId ? (
                                            <Link
                                                href={`/games/${r.gameId}/results`}
                                                className="hover:underline"
                                            >
                                                {r.value}
                                            </Link>
                                        ) : (
                                            r.value
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function SnapshotList({
    items,
    values,
    viewFullHref
}: {
    items: React.ReactNode[];
    values: string[];
    viewFullHref: string;
}) {
    return (
        <div>
            <ul className="space-y-1.5">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className="flex justify-between gap-2 text-sm"
                    >
                        <span>
                            {i + 1}. {item}
                        </span>
                        <span className="shrink-0">{values[i]}</span>
                    </li>
                ))}
            </ul>
            <Link
                href={viewFullHref}
                className="mt-3 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                View full leaderboard →
            </Link>
        </div>
    );
}
