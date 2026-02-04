'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, DollarSign, Users, ArrowRight, Filter } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/money';
import { GamesListProps } from '@/types/games';

export function GamesList({ games }: GamesListProps) {
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

    const filteredGames = games.filter((game) => {
        if (filter === 'all') return true;
        return filter === 'open'
            ? game.status === 'OPEN'
            : game.status === 'CLOSED';
    });

    const openGames = games.filter((g) => g.status === 'OPEN').length;
    const closedGames = games.filter((g) => g.status === 'CLOSED').length;

    return (
        <div className="space-y-6">
            <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as typeof filter)}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-3 lg:w-100">
                    <TabsTrigger value="all">All ({games.length})</TabsTrigger>
                    <TabsTrigger value="open">Active ({openGames})</TabsTrigger>
                    <TabsTrigger value="closed">
                        Closed ({closedGames})
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
                                  : 'Create your first game to get started'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGames.map((game) => {
                        // const totals = calculateGameTotals(game);
                        return (
                            <Card
                                key={game.id}
                                className="transition-shadow hover:shadow-lg"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl">
                                                {game.name}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(
                                                    new Date(game.scheduledAt),
                                                    'MMM d, yyyy'
                                                )}
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                game.status === 'OPEN'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {game.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                                {/* <DollarSign className="h-4 w-4" /> */}
                                                {formatCurrency(
                                                    game.totalBuyInCents
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {game.status === 'CLOSED' && (
                                        <div className="rounded-lg bg-muted p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Net Result
                                            </p>
                                            <p
                                                className={`text-lg font-semibold ${
                                                    game.deltaCents === 0
                                                        ? 'text-muted-foreground'
                                                        : game.deltaCents > 0
                                                          ? 'text-green-600 dark:text-green-400'
                                                          : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {game.deltaCents === 0
                                                    ? 'Balanced'
                                                    : formatCurrency(
                                                          Math.abs(
                                                              game.deltaCents
                                                          )
                                                      )}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        asChild
                                        className="w-full"
                                        variant={
                                            game.status === 'OPEN'
                                                ? 'default'
                                                : 'outline'
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
                    })}
                </div>
            )}
        </div>
    );
}
