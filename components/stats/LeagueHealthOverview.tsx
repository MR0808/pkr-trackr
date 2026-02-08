'use client';

import Link from 'next/link';
import { DollarSign, TrendingUp, Flame, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/money';
import type { StatsPageData, StatsAwards } from '@/types/stats';

type Props = {
    leagueHealth: StatsPageData['leagueHealth'];
    awards: StatsAwards;
};

export function LeagueHealthOverview({ leagueHealth, awards }: Props) {
    const { averagePotCents, mostRecentWinner } = leagueHealth;

    return (
        <div className="min-w-0">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                League health (all-time)
            </h2>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Average pot size
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(averagePotCents / 100)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per night (total buy-ins)
                        </p>
                    </CardContent>
                </Card>

                {awards.topWinner && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Most profitable
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">
                                <Link
                                    href={`/players/${awards.topWinner.playerId}`}
                                    className="text-primary hover:underline"
                                >
                                    {awards.topWinner.name}
                                </Link>
                            </p>
                            <p className="text-sm tabular-nums text-[hsl(var(--success))]">
                                {formatCurrency(awards.topWinner.totalProfitCents / 100)}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {awards.mostAction && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Most active
                            </CardTitle>
                            <Flame className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">
                                <Link
                                    href={`/players/${awards.mostAction.playerId}`}
                                    className="text-primary hover:underline"
                                >
                                    {awards.mostAction.name}
                                </Link>
                            </p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {formatCurrency(awards.mostAction.totalBuyInCents / 100)} buy-ins
                            </p>
                        </CardContent>
                    </Card>
                )}

                {mostRecentWinner && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Most recent winner
                            </CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">
                                <Link
                                    href={`/players/${mostRecentWinner.playerId}`}
                                    className="text-primary hover:underline"
                                >
                                    {mostRecentWinner.name}
                                </Link>
                            </p>
                            <Link
                                href={`/games/${mostRecentWinner.gameId}`}
                                className="text-xs text-muted-foreground hover:underline"
                            >
                                {mostRecentWinner.gameName} →
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
