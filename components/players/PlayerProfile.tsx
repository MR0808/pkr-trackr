'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
    ChevronRight
} from 'lucide-react';
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
import type { PlayerProfileData } from '@/actions/playerActions';

const GAMES_PAGE_SIZE = 10;

export function PlayerProfile({ data }: { data: PlayerProfileData }) {
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
        recentGames
    } = data;

    const [gamesPage, setGamesPage] = useState(1);
    const totalGamesPages = Math.max(
        1,
        Math.ceil(recentGames.length / GAMES_PAGE_SIZE)
    );
    const currentGamesPage = Math.min(gamesPage, totalGamesPages);
    const paginatedGames = useMemo(() => {
        const start = (currentGamesPage - 1) * GAMES_PAGE_SIZE;
        return recentGames.slice(start, start + GAMES_PAGE_SIZE);
    }, [recentGames, currentGamesPage]);

    return (
        <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {player.name}
                        </h1>
                        <p className="text-muted-foreground">
                            {totalGames} night{totalGames !== 1 ? 's' : ''}{' '}
                            played
                        </p>
                    </div>
                </div>
                <div
                    className={cn(
                        'text-2xl font-semibold tabular-nums',
                        totalProfitCents >= 0
                            ? 'text-[hsl(var(--success))]'
                            : 'text-destructive'
                    )}
                >
                    {formatCurrencyWithSign(totalProfitCents / 100)} all-time
                </div>
            </div>

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

            {/* All games */}
            <Card className="min-w-0 overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Gamepad2 className="h-5 w-5" />
                        All games
                    </CardTitle>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {recentGames.length} closed night
                        {recentGames.length !== 1 ? 's' : ''}. Click to view
                        full results.
                    </p>
                </CardHeader>
                <CardContent className="min-w-0 p-0">
                    {recentGames.length === 0 ? (
                        <div className="px-4 pb-4 text-sm text-muted-foreground sm:px-6 sm:pb-6">
                            No closed games yet.
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
                                        {totalGamesPages} ({recentGames.length}{' '}
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
