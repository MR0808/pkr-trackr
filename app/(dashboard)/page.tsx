import Link from 'next/link';
import {
    ArrowRight,
    Gamepad2,
    TrendingUp,
    Users,
    DollarSign,
    Plus
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
import { loadGamesForGroup } from '@/actions/games';
import { formatCurrency } from '@/lib/money';
import { format } from 'date-fns';

const DEFAULT_GROUP_ID = 'cml531khu0000kgf58q0meaku';

export default async function DashboardPage() {
    const games = await loadGamesForGroup({ groupId: DEFAULT_GROUP_ID });
    const openGames = games.filter((g) => g.status === 'OPEN');
    const closedGames = games.filter((g) => g.status === 'CLOSED');

    const totalMoneyIn = games.reduce((sum, g) => sum + g.totalBuyInCents / 100, 0);
    const totalMoneyOut = games.reduce((sum, g) => sum + g.totalCashOutCents / 100, 0);
    const totalPlayerEntries = games.reduce((sum, g) => sum + g.playerCount, 0);

    const recentGames = games.slice(0, 5);

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back to PkrTrackr
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/">
                        <Plus className="mr-2 h-5 w-5" />
                        Start New Game
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Games
                        </CardTitle>
                        <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{games.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {openGames.length} active, {closedGames.length}{' '}
                            closed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Player entries
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalPlayerEntries}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all games
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Money In
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalMoneyIn)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All buy-ins combined
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Money Out
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalMoneyOut)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All cashouts combined
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Games */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Games</CardTitle>
                            <CardDescription>
                                Your most recent game sessions
                            </CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/games">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentGames.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Gamepad2 className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">No games yet</p>
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
                        <div className="space-y-4">
                            {recentGames.map((game) => (
                                <div
                                    key={game.id}
                                    className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">
                                                {game.name}
                                            </h3>
                                            <Badge
                                                variant={
                                                    game.status === 'OPEN'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {game.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {format(
                                                new Date(game.scheduledAt),
                                                'MMM d, yyyy'
                                            )}{' '}
                                            • {game.playerCount} players •{' '}
                                            {formatCurrency(
                                                game.totalBuyInCents / 100
                                            )}{' '}
                                            in
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link href={`/games/${game.id}`}>
                                            {game.status === 'OPEN'
                                                ? 'Open'
                                                : 'View'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
