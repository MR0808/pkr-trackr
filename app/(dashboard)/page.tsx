import Link from 'next/link';
import {
    ArrowRight,
    Gamepad2,
    TrendingUp,
    Users,
    DollarSign,
    Plus,
    Trophy,
    Zap,
    Activity
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadDashboardPageData } from '@/actions/games';
import { getDefaultGroupId } from '@/lib/default-group';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import { format } from 'date-fns';
import { MomentumChart } from '@/components/dashboard/MomentumChart';

export default async function DashboardPage() {
    const groupId = await getDefaultGroupId();
    const data = await loadDashboardPageData({ groupId });

    const kpis = data.seasonKpis;
    const seasonName = data.currentSeason?.name ?? 'Season summary';

    return (
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        League health and momentum at a glance
                    </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                    <Link href="/">
                        <Plus className="mr-2 h-5 w-5" />
                        Start New Game
                    </Link>
                </Button>
            </div>

            {/* 1. Season summary cards (4–6 KPIs) */}
            <section className="min-w-0">
                <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                    {seasonName}
                </h2>
                {kpis ? (
                    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="min-w-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Nights played
                                </CardTitle>
                                <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {kpis.totalGames}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Closed games this season
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="min-w-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Players
                                </CardTitle>
                                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {kpis.uniquePlayers}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Unique this season
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="min-w-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total buy-ins
                                </CardTitle>
                                <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="truncate text-2xl font-bold">
                                    {formatCurrency(kpis.totalBuyInCents / 100)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Money in this season
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="min-w-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Net (season)
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={
                                        kpis.totalProfitCents === 0
                                            ? 'text-2xl font-bold text-muted-foreground'
                                            : kpis.totalProfitCents > 0
                                              ? 'text-2xl font-bold text-[hsl(var(--success))]'
                                              : 'text-2xl font-bold text-destructive'
                                    }
                                >
                                    {formatCurrencyWithSign(
                                        kpis.totalProfitCents / 100
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Out − In this season
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="min-w-0">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <Gamepad2 className="mb-2 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                No closed games this season yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Close a game to see season KPIs
                            </p>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* 2. Momentum chart */}
            {data.momentumData.length > 0 && (
                <section className="min-w-0">
                    <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                        Momentum
                    </h2>
                    <MomentumChart
                        momentumData={data.momentumData}
                        momentumPlayerNames={data.momentumPlayerNames}
                    />
                </section>
            )}

            {/* 3. Recent activity */}
            <section className="min-w-0">
                <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                    Recent activity
                </h2>
                <Card className="min-w-0 overflow-hidden">
                    <CardContent className="p-0">
                        {data.recentNights.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Gamepad2 className="mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-lg font-medium">
                                    No games yet
                                </p>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Start your first game to begin tracking
                                </p>
                                <Button asChild>
                                    <Link href="/">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Game
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {data.recentNights.map((night) => (
                                    <li key={night.id}>
                                        <Link
                                            href={`/games/${night.id}`}
                                            className="flex flex-col gap-2 p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {night.name}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            night.status ===
                                                            'OPEN'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {night.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(
                                                        new Date(
                                                            night.scheduledAt
                                                        ),
                                                        'MMM d, yyyy'
                                                    )}{' '}
                                                    · {night.playerCount}{' '}
                                                    players
                                                </p>
                                            </div>
                                            <span className="flex shrink-0 items-center text-sm text-primary">
                                                {night.status === 'OPEN'
                                                    ? 'Open'
                                                    : 'View'}
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                    {data.recentNights.length > 0 && (
                        <div className="border-t px-4 py-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/games">
                                    View all games
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </Card>
            </section>

            {/* 4. Quick highlights */}
            {(data.highlights.roiLeader ||
                data.highlights.biggestSingleNightWin ||
                data.highlights.mostActivePlayer) && (
                <section className="min-w-0">
                    <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                        Quick highlights
                    </h2>
                    <div className="flex min-w-0 flex-wrap gap-4 rounded-lg border bg-card p-4">
                        {data.highlights.roiLeader && (
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                                <span className="text-sm text-muted-foreground">
                                    ROI leader:
                                </span>
                                <Link
                                    href={`/players/${data.highlights.roiLeader.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.highlights.roiLeader.name}
                                </Link>
                                <span className="text-sm tabular-nums">
                                    {formatPercent(
                                        data.highlights.roiLeader.roi
                                    )}
                                </span>
                            </div>
                        )}
                        {data.highlights.biggestSingleNightWin && (
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                                <span className="text-sm text-muted-foreground">
                                    Biggest night:
                                </span>
                                <Link
                                    href={`/players/${data.highlights.biggestSingleNightWin.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.highlights.biggestSingleNightWin.name}
                                </Link>
                                <span className="text-sm tabular-nums text-[hsl(var(--success))]">
                                    {formatCurrencyWithSign(
                                        data.highlights.biggestSingleNightWin
                                            .profitCents / 100
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({data.highlights.biggestSingleNightWin.gameName})
                                </span>
                            </div>
                        )}
                        {data.highlights.mostActivePlayer && (
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    Most active:
                                </span>
                                <Link
                                    href={`/players/${data.highlights.mostActivePlayer.playerId}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {data.highlights.mostActivePlayer.name}
                                </Link>
                                <span className="text-sm tabular-nums text-muted-foreground">
                                    {formatCurrency(
                                        data.highlights.mostActivePlayer
                                            .totalBuyInCents / 100
                                    )}{' '}
                                    in
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
