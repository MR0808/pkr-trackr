import Link from 'next/link';
import {
    ArrowRight,
    Gamepad2,
    DollarSign,
    Users,
    Flame,
    Trophy,
    Zap,
    TrendingUp,
    Plus,
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadLeaguePulseData } from '@/actions/games';
import { getDefaultGroupId } from '@/lib/default-group';
import {
    formatCurrency,
    formatCurrencyWithSign,
    formatPercent
} from '@/lib/money';
import { format } from 'date-fns';
import { BalanceSnapshot } from '@/components/dashboard/BalanceSnapshot';

export default async function DashboardPage() {
    const groupId = await getDefaultGroupId();
    const data = await loadLeaguePulseData({ groupId });

    return (
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                        League Pulse
                    </h1>
                    <p className="text-muted-foreground">
                        Is the league active? Who&apos;s hot? What just happened?
                    </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                    <Link href="/">
                        <Plus className="mr-2 h-5 w-5" />
                        Start New Game
                    </Link>
                </Button>
            </div>

            {/* 1. League Health Strip */}
            <section className="min-w-0">
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total nights played
                            </CardTitle>
                            <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.health.totalNightsPlayed}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All-time
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total money played
                            </CardTitle>
                            <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="truncate text-2xl font-bold">
                                {formatCurrency(
                                    data.health.totalMoneyPlayedCents / 100
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All-time buy-ins
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Avg night pot
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="truncate text-2xl font-bold">
                                {formatCurrency(
                                    data.health.averageNightPotLast10Cents / 100
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Last 10 nights
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active players
                            </CardTitle>
                            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.health.activePlayersLast30Days}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Last 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* 2. Momentum Panel — Who's Hot */}
            <section className="min-w-0">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:text-xl">
                    <Flame className="h-5 w-5 text-amber-500" />
                    Who&apos;s hot
                </h2>
                {data.hotPlayers.length > 0 ? (
                    <Card className="min-w-0 overflow-hidden">
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {data.hotPlayers.map((player, i) => (
                                    <li key={player.playerId}>
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:flex-nowrap">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                                                    {i + 1}
                                                </span>
                                                <Link
                                                    href={`/players/${player.playerId}`}
                                                    className="truncate font-medium text-primary hover:underline"
                                                >
                                                    {player.name}
                                                </Link>
                                                {player.currentStreak !== 0 && (
                                                    <span
                                                        className={
                                                            player.currentStreak > 0
                                                                ? 'text-xs text-[hsl(var(--success))]'
                                                                : 'text-xs text-destructive'
                                                        }
                                                    >
                                                        {player.currentStreak > 0
                                                            ? `${player.currentStreak}W`
                                                            : `${Math.abs(player.currentStreak)}L`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-4 tabular-nums text-sm">
                                                <span
                                                    className={
                                                        player.profitCents >= 0
                                                            ? 'text-[hsl(var(--success))]'
                                                            : 'text-destructive'
                                                    }
                                                >
                                                    {formatCurrencyWithSign(
                                                        player.profitCents / 100
                                                    )}{' '}
                                                    <span className="text-muted-foreground">
                                                        (last 10)
                                                    </span>
                                                </span>
                                                {player.roi != null && (
                                                    <span className="text-muted-foreground">
                                                        {formatPercent(player.roi)}{' '}
                                                        ROI
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                            Last 10 nights · profit & ROI
                        </p>
                    </Card>
                ) : (
                    <Card className="min-w-0">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            No closed nights yet. Close a game to see who&apos;s
                            hot.
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* 3. Recent Nights Timeline */}
            <section className="min-w-0">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:text-xl">
                    <Calendar className="h-5 w-5" />
                    Recent nights
                </h2>
                {data.recentNights.length > 0 ? (
                    <Card className="min-w-0 overflow-hidden">
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {data.recentNights.map((night) => (
                                    <li key={night.gameId}>
                                        <div className="flex flex-col gap-1 p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/games/${night.gameId}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {night.gameName}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(
                                                        new Date(
                                                            night.scheduledAt
                                                        ),
                                                        'MMM d, yyyy'
                                                    )}{' '}
                                                    ·{' '}
                                                    {formatCurrency(
                                                        night.totalPotCents / 100
                                                    )}{' '}
                                                    pot · {night.playerCount}{' '}
                                                    players
                                                </p>
                                                {night.biggestWinner && (
                                                    <p className="mt-1 text-xs text-[hsl(var(--success))]">
                                                        Biggest winner:{' '}
                                                        <Link
                                                            href={`/players/${night.biggestWinner.playerId}`}
                                                            className="font-medium text-primary hover:underline"
                                                        >
                                                            {night.biggestWinner.name}
                                                        </Link>{' '}
                                                        (
                                                        {formatCurrencyWithSign(
                                                            night.biggestWinner
                                                                .profitCents / 100
                                                        )}
                                                        )
                                                    </p>
                                                )}
                                            </div>
                                            <Link
                                                href={`/games/${night.gameId}`}
                                                className="flex shrink-0 items-center text-sm text-primary hover:underline"
                                            >
                                                View
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="border-t px-4 py-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/games">
                                    View all games
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="min-w-0">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Gamepad2 className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">
                                No nights yet
                            </p>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Start your first game to see the heartbeat here
                            </p>
                            <Button asChild>
                                <Link href="/">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Game
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* 4. Big Moments */}
            <section className="min-w-0">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:text-xl">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Big moments
                </h2>
                <Card className="min-w-0">
                    <CardContent className="flex flex-wrap gap-x-6 gap-y-4 py-4">
                        {data.bigMoments.biggestSingleNightWin && (
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                                <span className="text-sm text-muted-foreground">
                                    Biggest night:
                                </span>
                                <Link
                                    href={`/players/${data.bigMoments.biggestSingleNightWin.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.bigMoments.biggestSingleNightWin.name}
                                </Link>
                                <span className="text-sm tabular-nums text-[hsl(var(--success))]">
                                    {formatCurrencyWithSign(
                                        data.bigMoments.biggestSingleNightWin
                                            .profitCents / 100
                                    )}
                                </span>
                            </div>
                        )}
                        {data.bigMoments.largestPotEver && (
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    Largest pot:
                                </span>
                                <Link
                                    href={`/games/${data.bigMoments.largestPotEver.gameId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {formatCurrency(
                                        data.bigMoments.largestPotEver.totalPotCents /
                                            100
                                    )}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    ({data.bigMoments.largestPotEver.gameName})
                                </span>
                            </div>
                        )}
                        {data.bigMoments.longestWinStreak && (
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    Longest streak:
                                </span>
                                <Link
                                    href={`/players/${data.bigMoments.longestWinStreak.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.bigMoments.longestWinStreak.name}
                                </Link>
                                <span className="text-sm tabular-nums">
                                    {data.bigMoments.longestWinStreak.streak}{' '}
                                    wins
                                </span>
                            </div>
                        )}
                        {data.bigMoments.mostProfitableAllTime && (
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                                <span className="text-sm text-muted-foreground">
                                    Most profitable:
                                </span>
                                <Link
                                    href={`/players/${data.bigMoments.mostProfitableAllTime.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.bigMoments.mostProfitableAllTime.name}
                                </Link>
                                <span className="text-sm tabular-nums text-[hsl(var(--success))]">
                                    {formatCurrencyWithSign(
                                        data.bigMoments.mostProfitableAllTime
                                            .totalProfitCents / 100
                                    )}
                                </span>
                            </div>
                        )}
                        {!data.bigMoments.biggestSingleNightWin &&
                            !data.bigMoments.largestPotEver &&
                            !data.bigMoments.longestWinStreak &&
                            !data.bigMoments.mostProfitableAllTime && (
                                <p className="text-sm text-muted-foreground">
                                    Close some games to see big moments.
                                </p>
                            )}
                    </CardContent>
                </Card>
            </section>

            {/* 5. League Balance Snapshot */}
            {data.balance.length > 0 && (
                <section className="min-w-0">
                    <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                        League balance
                    </h2>
                    <Card className="min-w-0">
                        <CardContent className="pt-4">
                            <BalanceSnapshot players={data.balance} />
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
