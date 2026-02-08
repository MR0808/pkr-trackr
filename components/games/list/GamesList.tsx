'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Calendar,
    Users,
    ArrowRight,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { GameListRowWithResults } from '@/actions/games';
import { GamesListPageProps } from '@/types/games';

const PAGE_SIZE = 6;

export function GamesList({ data }: GamesListPageProps) {
    const { games, seasons } = data;
    const [scope, setScope] = useState<'all' | string>('all');
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [page, setPage] = useState(1);

    const filteredGames = useMemo(() => {
        return games.filter((game) => {
            if (scope !== 'all' && game.seasonId !== scope) return false;
            if (filter === 'all') return true;
            return filter === 'open'
                ? game.status === 'OPEN'
                : game.status === 'CLOSED';
        });
    }, [games, scope, filter]);

    const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedGames = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredGames.slice(start, start + PAGE_SIZE);
    }, [filteredGames, currentPage]);

    const openCount = useMemo(
        () =>
            games.filter((g) => {
                if (scope !== 'all' && g.seasonId !== scope) return false;
                return g.status === 'OPEN';
            }).length,
        [games, scope]
    );
    const closedCount = useMemo(
        () =>
            games.filter((g) => {
                if (scope !== 'all' && g.seasonId !== scope) return false;
                return g.status === 'CLOSED';
            }).length,
        [games, scope]
    );
    const allCount = useMemo(
        () =>
            games.filter((g) => scope === 'all' || g.seasonId === scope).length,
        [games, scope]
    );

    const handleScopeChange = (v: string) => {
        setScope(v);
        setPage(1);
    };
    const handleFilterChange = (v: string) => {
        setFilter(v as typeof filter);
        setPage(1);
    };

    return (
        <div className="min-w-0 space-y-6 overflow-hidden">
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                <label
                    className="text-sm font-medium text-muted-foreground"
                    htmlFor="games-scope"
                >
                    Scope
                </label>
                <select
                    id="games-scope"
                    value={scope}
                    onChange={(e) => handleScopeChange(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="all">All time</option>
                    {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            <Tabs
                value={filter}
                onValueChange={handleFilterChange}
                className="w-full min-w-0"
            >
                <TabsList className="grid w-full min-w-0 grid-cols-3">
                    <TabsTrigger value="all">All ({allCount})</TabsTrigger>
                    <TabsTrigger value="open">Active ({openCount})</TabsTrigger>
                    <TabsTrigger value="closed">
                        Closed ({closedCount})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {filteredGames.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No games found</p>
                        <p className="text-sm text-muted-foreground">
                            {filter === 'open'
                                ? 'No active games at the moment'
                                : filter === 'closed'
                                  ? 'No closed games yet'
                                  : scope === 'all'
                                    ? 'Create your first game to get started'
                                    : 'No games in this season'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedGames.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages} (
                                {filteredGames.length} games)
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function GameCard({ game }: { game: GameListRowWithResults }) {
    return (
        <Card className="min-w-0 overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(game.scheduledAt), 'MMM d, yyyy')}
                        </CardDescription>
                    </div>
                    <Badge
                        variant={
                            game.status === 'OPEN' ? 'default' : 'secondary'
                        }
                    >
                        {game.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
                <div className="grid min-w-0 grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Players
                        </p>
                        <p className="flex items-center gap-1 text-lg font-semibold">
                            <Users className="h-4 w-4" />
                            {game.playerCount}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Total In
                        </p>
                        <p className="flex items-center gap-1 text-lg font-semibold">
                            {formatCurrency(game.totalBuyInCents / 100)}
                        </p>
                    </div>
                </div>

                {game.results.length > 0 && (
                    <div className="min-w-0 overflow-hidden rounded-md border">
                        <Table className="w-full min-w-0">
                            <TableHeader>
                                <TableRow className="border-b">
                                    <TableHead className="min-w-0 text-xs">
                                        Player
                                    </TableHead>
                                    <TableHead className="hidden text-right text-xs tabular-nums sm:table-cell">
                                        In
                                    </TableHead>
                                    <TableHead className="hidden text-right text-xs tabular-nums sm:table-cell">
                                        Out
                                    </TableHead>
                                    <TableHead className="text-right text-xs tabular-nums">
                                        Result
                                    </TableHead>
                                    <TableHead className="hidden text-right text-xs tabular-nums sm:table-cell">
                                        Score
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {game.results.map((r) => (
                                    <TableRow
                                        key={r.playerName}
                                        className="border-b last:border-0"
                                    >
                                        <TableCell className="min-w-0 text-xs font-medium">
                                            <span className="truncate">{r.playerName}</span>
                                        </TableCell>
                                        <TableCell className="hidden text-right text-xs tabular-nums sm:table-cell">
                                            {formatCurrency(
                                                r.buyInCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden text-right text-xs tabular-nums text-muted-foreground sm:table-cell">
                                            {r.cashOutCents != null
                                                ? formatCurrency(
                                                      r.cashOutCents / 100
                                                  )
                                                : '—'}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                'shrink-0 text-right text-xs tabular-nums',
                                                r.profitCents >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                            )}
                                        >
                                            {formatCurrencyWithSign(
                                                r.profitCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden text-right text-xs tabular-nums sm:table-cell">
                                            {r.nightScore.toFixed(1)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {game.status === 'CLOSED' && (
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground">
                            Net Result
                        </p>
                        <p
                            className={cn(
                                'text-lg font-semibold',
                                game.deltaCents === 0
                                    ? 'text-muted-foreground'
                                    : game.deltaCents > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                            )}
                        >
                            {game.deltaCents === 0
                                ? 'Balanced'
                                : formatCurrency(
                                      Math.abs(game.deltaCents) / 100
                                  )}
                        </p>
                    </div>
                )}

                <Button
                    asChild
                    className="w-full"
                    variant={
                        game.status === 'OPEN' ? 'default' : 'outline'
                    }
                >
                    <Link href={`/games/${game.id}`}>
                        {game.status === 'OPEN'
                            ? 'Open Cashier'
                            : 'View Results'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
