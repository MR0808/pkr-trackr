'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
    UserCircle,
    Gamepad2,
    TrendingUp,
    Target,
    Trophy,
    Percent,
    Calendar,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ArrowDownLeft,
    ArrowUpRight
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type {
    PlayerProfileData,
    PlayerComparisonData,
    PlayerRankRow,
    PlayerSeasonResult
} from '@/actions/playerActions';

const GAMES_PAGE_SIZE = 10;
type DateRangeFilter = 'all' | '7' | '30';
type SeasonSortKey = 'profit' | 'roi' | 'score' | 'season';
type NightSortKey = 'profit' | 'roi' | 'tableShare';

function ComparisonTable({
    rows,
    currentPlayerId,
    currentPlayerName,
    currentProfitCents,
    currentRoi,
    currentPlayerRank
}: {
    rows: PlayerRankRow[];
    currentPlayerId: string;
    currentPlayerName: string;
    currentProfitCents: number;
    currentRoi: number | null;
    currentPlayerRank?: number | null;
}) {
    const includesCurrent = rows.some((r) => r.playerId === currentPlayerId);
    const displayRows = includesCurrent
        ? rows
        : [
              ...rows,
              {
                  rank: currentPlayerRank ?? 0,
                  playerId: currentPlayerId,
                  name: currentPlayerName,
                  totalProfitCents: currentProfitCents,
                  roi: currentRoi
              } as PlayerRankRow
          ];
    return (
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-14">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right tabular-nums">
                            Total profit
                        </TableHead>
                        <TableHead className="text-right tabular-nums">
                            ROI
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayRows.map((row) => {
                        const isYou = row.playerId === currentPlayerId;
                        return (
                            <TableRow
                                key={row.playerId}
                                className={cn(
                                    isYou && 'bg-muted/50 font-medium')
                                }
                            >
                                <TableCell className="tabular-nums">
                                    {row.rank > 0 ? `#${row.rank}` : '—'}
                                </TableCell>
                                <TableCell>
                                    {isYou ? (
                                        <span className="text-primary">
                                            {row.name} (you)
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/players/${row.playerId}`}
                                            className="text-primary hover:underline"
                                        >
                                            {row.name}
                                        </Link>
                                    )}
                                </TableCell>
                                <TableCell
                                    className={cn(
                                        'text-right tabular-nums',
                                        row.totalProfitCents >= 0
                                            ? 'text-[hsl(var(--success))]'
                                            : 'text-destructive'
                                    )}
                                >
                                    {formatCurrencyWithSign(
                                        row.totalProfitCents / 100
                                    )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {row.roi != null
                                        ? formatPercent(row.roi)
                                        : '—'}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

type Props = {
    data: PlayerProfileData;
    comparison: PlayerComparisonData | null;
};

export function PlayerProfile({ data, comparison }: Props) {
    const {
        player,
        totalGames,
        totalBuyInCents,
        totalProfitCents,
        roi,
        nightsWon,
        podiumPoints,
        winRate,
        nightsInProfit,
        currentStreak,
        longestWinStreak,
        longestLoseStreak,
        currentSeason,
        currentSeasonProfitCents,
        currentSeasonRoi,
        recentGames,
        seasonResults,
        bestNight,
        worstNight
    } = data;

    const [gamesPage, setGamesPage] = useState(1);
    const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
    const [seasonSort, setSeasonSort] = useState<SeasonSortKey>('profit');
    const [nightSort, setNightSort] = useState<NightSortKey>('profit');

    const filteredGames = useMemo(() => {
        if (dateRange === 'all') return recentGames;
        const days = dateRange === '7' ? 7 : 30;
        const cut = new Date();
        cut.setDate(cut.getDate() - days);
        return recentGames.filter((g) => new Date(g.scheduledAt) >= cut);
    }, [recentGames, dateRange]);

    const sortedSeasonResults = useMemo(() => {
        const arr = [...seasonResults];
        if (seasonSort === 'season') {
            arr.sort((a, b) => {
                if (a.seasonName === 'All time') return 1;
                if (b.seasonName === 'All time') return -1;
                return a.seasonName.localeCompare(b.seasonName);
            });
        } else if (seasonSort === 'profit') {
            arr.sort((a, b) => b.totalProfitCents - a.totalProfitCents);
        } else if (seasonSort === 'roi') {
            arr.sort((a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity));
        } else {
            arr.sort(
                (a, b) =>
                    (b.performanceScore ?? -Infinity) -
                    (a.performanceScore ?? -Infinity)
            );
        }
        return arr;
    }, [seasonResults, seasonSort]);

    const sortedNightGames = useMemo(() => {
        const arr = [...filteredGames];
        if (nightSort === 'profit')
            arr.sort((a, b) => b.profitCents - a.profitCents);
        else if (nightSort === 'roi')
            arr.sort(
                (a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity)
            );
        else
            arr.sort(
                (a, b) =>
                    (b.tableShare ?? -Infinity) - (a.tableShare ?? -Infinity)
            );
        return arr;
    }, [filteredGames, nightSort]);

    const totalGamesPages = Math.max(
        1,
        Math.ceil(sortedNightGames.length / GAMES_PAGE_SIZE)
    );
    const currentGamesPage = Math.min(gamesPage, totalGamesPages);

    const paginatedGames = useMemo(() => {
        const start = (currentGamesPage - 1) * GAMES_PAGE_SIZE;
        return sortedNightGames.slice(start, start + GAMES_PAGE_SIZE);
    }, [sortedNightGames, currentGamesPage]);

    const chartGames = useMemo(
        () => (dateRange === 'all' ? recentGames : filteredGames),
        [dateRange, recentGames, filteredGames]
    );
    const chronoForCharts = useMemo(
        () => [...chartGames].reverse(),
        [chartGames]
    );

    return (
        <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* 1. Player Overview */}
            <div className="flex min-w-0 flex-col gap-6 rounded-lg border bg-card p-4 sm:p-6 lg:flex-row lg:items-start lg:gap-8">
                <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row lg:flex-col lg:items-center">
                    {player.image ? (
                        <Image
                            src={player.image}
                            alt={player.fullName}
                            width={96}
                            height={96}
                            className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted sm:h-24 sm:w-24">
                            <UserCircle className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                        </div>
                    )}
                    <div className="text-center sm:text-left lg:text-center">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {player.fullName}
                        </h1>
                        <p className="text-muted-foreground">
                            {totalGames} night{totalGames !== 1 ? 's' : ''} played
                        </p>
                    </div>
                </div>
                    <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4 gap-y-2">
                        <div
                            className={cn(
                                'text-xl font-semibold tabular-nums sm:text-2xl',
                                totalProfitCents >= 0
                                    ? 'text-[hsl(var(--success))]'
                                    : 'text-destructive'
                            )}
                        >
                            {formatCurrencyWithSign(totalProfitCents / 100)} all-time
                        </div>
                        {comparison?.currentSeasonRank != null &&
                            comparison.currentSeasonName && (
                                <Badge variant="secondary" className="text-xs">
                                    Ranked #{comparison.currentSeasonRank} in{' '}
                                    {comparison.currentSeasonName}
                                </Badge>
                            )}
                        {comparison?.allTimeRank != null && (
                            <Badge variant="outline" className="text-xs">
                                Ranked #{comparison.allTimeRank} all-time
                            </Badge>
                        )}
                        {currentStreak !== 0 && (
                            <Badge
                                variant={currentStreak > 0 ? 'default' : 'destructive'}
                                className="text-xs"
                            >
                                {currentStreak > 0
                                    ? `${currentStreak}W streak`
                                    : `${Math.abs(currentStreak)}L streak`}
                            </Badge>
                        )}
                        {longestWinStreak > 0 && (
                            <span className="text-sm text-muted-foreground">
                                Longest win streak: {longestWinStreak}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
                        <div>
                            <p className="text-muted-foreground">Total buy-ins</p>
                            <p className="font-medium tabular-nums">
                                {formatCurrency(totalBuyInCents / 100)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Overall ROI</p>
                            <p className="font-medium tabular-nums">
                                {roi != null ? formatPercent(roi) : '—'}
                            </p>
                        </div>
                        {currentSeason && (
                            <>
                                <div>
                                    <p className="text-muted-foreground">
                                        {currentSeason.name} profit
                                    </p>
                                    <p
                                        className={cn(
                                            'font-medium tabular-nums',
                                            currentSeasonProfitCents >= 0
                                                ? 'text-[hsl(var(--success))]'
                                                : 'text-destructive'
                                        )}
                                    >
                                        {formatCurrencyWithSign(
                                            currentSeasonProfitCents / 100
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        {currentSeason.name} ROI
                                    </p>
                                    <p className="font-medium tabular-nums">
                                        {currentSeasonRoi != null
                                            ? formatPercent(currentSeasonRoi)
                                            : '—'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    {bestNight && (
                        <div className="rounded-md border bg-muted/50 p-3 text-sm">
                            <p className="font-medium text-muted-foreground">
                                Best night
                            </p>
                            <p className="mt-1">
                                {format(new Date(bestNight.scheduledAt), 'MMM d, yyyy')} ·{' '}
                                {bestNight.gameName}
                            </p>
                            <p className="mt-1 tabular-nums text-[hsl(var(--success))]">
                                {formatCurrencyWithSign(bestNight.profitCents / 100)}
                                {bestNight.roi != null &&
                                    ` (${formatPercent(bestNight.roi)} ROI)`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Best / Worst Night cards */}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {bestNight && (
                    <Card className="min-w-0 overflow-hidden border-[hsl(var(--success))]/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--success))]">
                                <ArrowUpRight className="h-4 w-4" />
                                Best night
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="font-medium">
                                <Link
                                    href={`/games/${bestNight.gameId}`}
                                    className="text-primary hover:underline"
                                >
                                    {bestNight.gameName}
                                </Link>
                            </p>
                            <p className="text-muted-foreground">
                                {format(new Date(bestNight.scheduledAt), 'MMM d, yyyy')}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Buy-in</span>
                                <span className="tabular-nums">
                                    {formatCurrency(bestNight.buyInCents / 100)}
                                </span>
                                <span className="text-muted-foreground">Cash-out</span>
                                <span className="tabular-nums">
                                    {bestNight.cashOutCents != null
                                        ? formatCurrency(bestNight.cashOutCents / 100)
                                        : '—'}
                                </span>
                                <span className="text-muted-foreground">Profit</span>
                                <span className="tabular-nums text-[hsl(var(--success))]">
                                    {formatCurrencyWithSign(bestNight.profitCents / 100)}
                                </span>
                                <span className="text-muted-foreground">ROI</span>
                                <span className="tabular-nums">
                                    {bestNight.roi != null
                                        ? formatPercent(bestNight.roi)
                                        : '—'}
                                </span>
                                <span className="text-muted-foreground">Table share</span>
                                <span className="tabular-nums">
                                    {bestNight.tableShare != null
                                        ? formatPercent(bestNight.tableShare)
                                        : '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {worstNight && (
                    <Card className="min-w-0 overflow-hidden border-destructive/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                                <ArrowDownLeft className="h-4 w-4" />
                                Worst night
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="font-medium">
                                <Link
                                    href={`/games/${worstNight.gameId}`}
                                    className="text-primary hover:underline"
                                >
                                    {worstNight.gameName}
                                </Link>
                            </p>
                            <p className="text-muted-foreground">
                                {format(new Date(worstNight.scheduledAt), 'MMM d, yyyy')}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Buy-in</span>
                                <span className="tabular-nums">
                                    {formatCurrency(worstNight.buyInCents / 100)}
                                </span>
                                <span className="text-muted-foreground">Cash-out</span>
                                <span className="tabular-nums">
                                    {worstNight.cashOutCents != null
                                        ? formatCurrency(worstNight.cashOutCents / 100)
                                        : '—'}
                                </span>
                                <span className="text-muted-foreground">Loss</span>
                                <span className="tabular-nums text-destructive">
                                    {formatCurrencyWithSign(worstNight.profitCents / 100)}
                                </span>
                                <span className="text-muted-foreground">ROI</span>
                                <span className="tabular-nums">
                                    {worstNight.roi != null
                                        ? formatPercent(worstNight.roi)
                                        : '—'}
                                </span>
                                <span className="text-muted-foreground">Table share</span>
                                <span className="tabular-nums">
                                    {worstNight.tableShare != null
                                        ? formatPercent(worstNight.tableShare)
                                        : '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Player rank & performance comparison */}
            {comparison && (
                <Card className="min-w-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            Performance comparison
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Compare with top players in the league
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {comparison.currentSeasonName &&
                            comparison.topPlayersCurrentSeason.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                                        Top 5 · {comparison.currentSeasonName}
                                        {comparison.currentSeasonRank != null && (
                                            <span className="ml-2 font-normal">
                                                (You: #{comparison.currentSeasonRank} of{' '}
                                                {comparison.currentSeasonTotalPlayers})
                                            </span>
                                        )}
                                    </h3>
                                    <ComparisonTable
                                        rows={comparison.topPlayersCurrentSeason}
                                        currentPlayerId={player.id}
                                        currentPlayerName={player.fullName}
                                        currentProfitCents={
                                            currentSeasonProfitCents
                                        }
                                        currentRoi={currentSeasonRoi}
                                        currentPlayerRank={
                                            comparison.currentSeasonRank
                                        }
                                    />
                                </div>
                            )}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                                Top 5 · All-time
                                {comparison.allTimeRank != null && (
                                    <span className="ml-2 font-normal">
                                        (You: #{comparison.allTimeRank} of{' '}
                                        {comparison.allTimeTotalPlayers})
                                    </span>
                                )}
                            </h3>
                            <ComparisonTable
                                rows={comparison.topPlayersAllTime}
                                currentPlayerId={player.id}
                                currentPlayerName={player.fullName}
                                currentProfitCents={totalProfitCents}
                                currentRoi={roi}
                                currentPlayerRank={comparison.allTimeRank}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Season Results Table */}
            {seasonResults.length > 0 && (
                <Card className="min-w-0 overflow-hidden">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg sm:text-xl">
                                Season results
                            </CardTitle>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                By season or no season
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">
                                Sort by
                            </label>
                            <select
                                value={seasonSort}
                                onChange={(e) =>
                                    setSeasonSort(e.target.value as SeasonSortKey)
                                }
                                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                                <option value="profit">Profit</option>
                                <option value="roi">ROI</option>
                                <option value="score">Performance score</option>
                                <option value="season">Season</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Season</TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Nights
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Buy-ins
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Cash-outs
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Profit
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            ROI
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Score
                                        </TableHead>
                                        <TableHead className="text-right tabular-nums">
                                            Avg table share
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedSeasonResults.map((row) => (
                                        <TableRow key={row.seasonId ?? row.seasonName}>
                                            <TableCell className="font-medium">
                                                {row.seasonName}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {row.nightsPlayed}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {formatCurrency(row.totalBuyInCents / 100)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {formatCurrency(row.totalCashOutCents / 100)}
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right tabular-nums',
                                                    row.totalProfitCents >= 0
                                                        ? 'text-[hsl(var(--success))]'
                                                        : 'text-destructive'
                                                )}
                                            >
                                                {formatCurrencyWithSign(
                                                    row.totalProfitCents / 100
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {row.roi != null
                                                    ? formatPercent(row.roi)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {row.performanceScore != null
                                                    ? row.performanceScore.toFixed(1)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {row.avgTableShare != null
                                                    ? formatPercent(row.avgTableShare)
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary cards */}
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total buy-ins
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalBuyInCents / 100)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ROI</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {roi != null ? formatPercent(roi) : '—'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Nights won
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {nightsWon}
                            <span className="text-sm font-normal text-muted-foreground">
                                {' '}
                                / {totalGames}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Win rate {formatPercent(winRate)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Podium / In profit
                        </CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {podiumPoints} pts
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {nightsInProfit} nights in profit (3/2/1 for 1st/2nd/3rd)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Trends: Profit + ROI + Win/Loss */}
            {chronoForCharts.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold sm:text-xl">
                        Trends & analytics
                    </h2>
                    <div className="grid min-w-0 gap-6 lg:grid-cols-1">
                        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                            <span className="text-sm text-muted-foreground">
                                Timeframe
                            </span>
                            {(['all', '30', '7'] as const).map((r) => (
                                <Button
                                    key={r}
                                    variant={dateRange === r ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateRange(r)}
                                >
                                    {r === 'all'
                                        ? 'All'
                                        : r === '7'
                                          ? 'Last 7 days'
                                          : 'Last 30 days'}
                                </Button>
                            ))}
                        </div>
                        {/* Profit over time */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">
                                    Profit over time (cumulative)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="min-w-0"
                                    style={{ height: 220 }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height={220}
                                        minWidth={0}
                                    >
                                        <LineChart
                                            data={chronoForCharts.map((g, i) => {
                                                let cum = 0;
                                                for (let j = 0; j <= i; j++)
                                                    cum += chronoForCharts[j].profitCents;
                                                return {
                                                    label: format(
                                                        new Date(g.scheduledAt),
                                                        'MMM d'
                                                    ),
                                                    cumulative: cum / 100
                                                };
                                            })}
                                            margin={{
                                                top: 8,
                                                right: 8,
                                                left: 0,
                                                bottom: 0
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-muted"
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11 }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11 }}
                                                className="text-muted-foreground"
                                                tickFormatter={(v) =>
                                                    formatCurrencyWithSign(v)
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius:
                                                        'var(--radius)',
                                                    border: '1px solid hsl(var(--border))'
                                                }}
                                                formatter={(
                                                    value: number | undefined
                                                ) => [
                                                    formatCurrencyWithSign(
                                                        value ?? 0
                                                    ),
                                                    'Cumulative'
                                                ]}
                                                labelFormatter={(label) =>
                                                    `Night: ${label}`
                                                }
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="cumulative"
                                                stroke="var(--primary)"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                connectNulls
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        {/* ROI over time */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">
                                    ROI over time
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={220}
                                        minWidth={0}
                                    >
                                        <LineChart
                                            data={chronoForCharts.map((g) => ({
                                                label: format(
                                                    new Date(g.scheduledAt),
                                                    'MMM d'
                                                ),
                                                roi:
                                                    g.roi != null
                                                        ? g.roi * 100
                                                        : null
                                            }))}
                                            margin={{
                                                top: 8,
                                                right: 8,
                                                left: 0,
                                                bottom: 0
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-muted"
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11 }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11 }}
                                                className="text-muted-foreground"
                                                tickFormatter={(v) =>
                                                    `${v}%`
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius:
                                                        'var(--radius)',
                                                    border: '1px solid hsl(var(--border))'
                                                }}
                                                formatter={(
                                                    value: number | undefined
                                                ) => [
                                                    value != null
                                                        ? formatPercent(
                                                              value / 100
                                                          )
                                                        : '—',
                                                    'ROI'
                                                ]}
                                                labelFormatter={(label) =>
                                                    `Night: ${label}`
                                                }
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="roi"
                                                stroke="var(--chart-2, #16a34a)"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                connectNulls
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Win/Loss breakdown */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">
                                    Win / loss (last {chartGames.length} nights)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const wins = chartGames.filter(
                                        (g) => g.profitCents > 0
                                    ).length;
                                    const losses = chartGames.filter(
                                        (g) => g.profitCents < 0
                                    ).length;
                                    const data = [
                                        {
                                            name: 'Wins',
                                            count: wins,
                                            fill: 'var(--success)'
                                        },
                                        {
                                            name: 'Losses',
                                            count: losses,
                                            fill: 'var(--destructive)'
                                        }
                                    ].filter((d) => d.count > 0);
                                    if (data.length === 0) {
                                        return (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No data in range
                                            </p>
                                        );
                                    }
                                    return (
                                        <div style={{ height: 200 }}>
                                            <ResponsiveContainer
                                                width="100%"
                                                height={200}
                                                minWidth={0}
                                            >
                                                <BarChart
                                                    data={data}
                                                    layout="vertical"
                                                    margin={{
                                                        top: 8,
                                                        right: 8,
                                                        left: 40,
                                                        bottom: 8
                                                    }}
                                                >
                                                    <XAxis
                                                        type="number"
                                                        allowDecimals={false}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="name"
                                                        width={50}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        radius={[0, 4, 4, 0]}
                                                    >
                                                        {data.map((entry, i) => (
                                                            <Cell
                                                                key={i}
                                                                fill={entry.fill}
                                                            />
                                                        ))}
                                                    </Bar>
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius:
                                                                'var(--radius)'
                                                        }}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <p className="mt-2 text-center text-xs text-muted-foreground">
                                                {wins} wins · {losses} losses
                                            </p>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Detailed night-by-night */}
            <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Gamepad2 className="h-5 w-5" />
                            Night-by-night
                        </CardTitle>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            {filteredGames.length} night
                            {filteredGames.length !== 1 ? 's' : ''} in range.
                            Click to view full results.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Date range
                            </span>
                            <select
                                value={dateRange}
                                onChange={(e) =>
                                    setDateRange(e.target.value as DateRangeFilter)
                                }
                                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                                <option value="all">All</option>
                                <option value="30">Last 30 days</option>
                                <option value="7">Last 7 days</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Sort by
                            </span>
                            <select
                                value={nightSort}
                                onChange={(e) =>
                                    setNightSort(e.target.value as NightSortKey)
                                }
                                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                                <option value="profit">Profit</option>
                                <option value="roi">ROI</option>
                                <option value="tableShare">Table share</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="min-w-0 p-0">
                    {sortedNightGames.length === 0 ? (
                        <div className="px-4 pb-4 text-sm text-muted-foreground sm:px-6 sm:pb-6">
                            No games in selected range.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] sm:overflow-visible">
                                <Table className="w-full min-w-0">
                                    <TableHeader>
                                        <TableRow className="border-b">
                                            <TableHead className="shrink-0">Date</TableHead>
                                            <TableHead className="min-w-0">Game</TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                In
                                            </TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                Out
                                            </TableHead>
                                            <TableHead className="text-right tabular-nums">
                                                Result
                                            </TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                ROI
                                            </TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                Pot
                                            </TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                Table share
                                            </TableHead>
                                            <TableHead className="hidden text-right tabular-nums sm:table-cell">
                                                Score
                                            </TableHead>
                                            <TableHead className="shrink-0 text-center">
                                                Place
                                            </TableHead>
                                            <TableHead className="w-10 shrink-0" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedGames.map((g) => (
                                        <TableRow
                                            key={g.gameId}
                                            className="border-b last:border-0"
                                        >
                                            <TableCell className="shrink-0 text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {format(
                                                        new Date(g.scheduledAt),
                                                        'MMM d, yyyy'
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell className="min-w-0 font-medium">
                                                <span className="truncate">{g.gameName}</span>
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                {formatCurrency(
                                                    g.buyInCents / 100
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                                                {g.cashOutCents != null
                                                    ? formatCurrency(
                                                          g.cashOutCents / 100
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'shrink-0 text-right tabular-nums',
                                                    g.profitCents >= 0
                                                        ? 'text-[hsl(var(--success))]'
                                                        : 'text-destructive'
                                                )}
                                            >
                                                {formatCurrencyWithSign(
                                                    g.profitCents / 100
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                {g.roi != null
                                                    ? formatPercent(g.roi)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                                                {formatCurrency(g.totalPotCents / 100)}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                {g.tableShare != null
                                                    ? formatPercent(g.tableShare)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                {g.nightScore.toFixed(1)}
                                            </TableCell>
                                            <TableCell className="shrink-0 text-center">
                                                <Badge
                                                    variant={
                                                        g.rank === 1
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    #{g.rank}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/games/${g.gameId}`}
                                                        aria-label="View game"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {totalGamesPages > 1 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3 sm:px-6">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentGamesPage} of{' '}
                                        {totalGamesPages} ({sortedNightGames.length}{' '}
                                        games)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setGamesPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            disabled={currentGamesPage <= 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setGamesPage((p) =>
                                                    Math.min(
                                                        totalGamesPages,
                                                        p + 1
                                                    )
                                                )
                                            }
                                            disabled={
                                                currentGamesPage >=
                                                totalGamesPages
                                            }
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
