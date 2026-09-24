'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import type {
    InsightsNarrative,
    SkillRatingRow,
    HeaterIndexRow,
    WeirdInsight
} from '@/types/stats';

type Props = {
    narrative: InsightsNarrative;
    skillRatings: SkillRatingRow[];
    heaterIndex: HeaterIndexRow[];
    weirdInsights: WeirdInsight[];
};

export function InsightsView({
    narrative,
    skillRatings,
    heaterIndex,
    weirdInsights
}: Props) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>League narrative</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Auto-generated summary from current filters
                    </p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed">
                        {narrative.summary || 'No data to summarize.'}
                    </p>
                </CardContent>
            </Card>

            <section className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold sm:text-xl">
                        Weird &amp; wonderful
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Quirky awards the leaderboards would never dare print.
                        Respectfully unserious.
                    </p>
                </div>
                {weirdInsights.length === 0 ? (
                    <Card>
                        <CardContent className="py-6 text-center text-sm text-muted-foreground">
                            Not enough closed nights yet for the deep lore.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {weirdInsights.map((insight) => (
                            <Card key={insight.id} className="min-w-0">
                                <CardHeader className="space-y-1 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {insight.title}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {insight.blurb}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <div className="truncate text-xl font-bold">
                                        {insight.playerId ? (
                                            <Link
                                                href={`/players/${insight.playerId}`}
                                                className="text-primary hover:underline"
                                            >
                                                {insight.headline}
                                            </Link>
                                        ) : insight.gameId ? (
                                            <Link
                                                href={`/games/${insight.gameId}/results`}
                                                className="text-primary hover:underline"
                                            >
                                                {insight.headline}
                                            </Link>
                                        ) : (
                                            insight.headline
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {insight.valueLabel}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Skill rating
                        <Badge variant="secondary">Experimental</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Elo-style approximation from nightly rank. Computed on
                        read, not stored.
                    </p>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    {skillRatings.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No games to compute ratings.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background">
                                        Player
                                    </TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Change (last N)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {skillRatings.map((r, i) => (
                                    <TableRow key={r.playerId}>
                                        <TableCell className="sticky left-0 bg-background font-medium">
                                            {i + 1}. {r.name}
                                        </TableCell>
                                        <TableCell>{r.rating}</TableCell>
                                        <TableCell>{r.changeLastN}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Heater index</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Nights where ROI &gt; 50% and buy-in ≤ $20 (count per
                        player)
                    </p>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    {heaterIndex.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No heater nights in range.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background">
                                        Player
                                    </TableHead>
                                    <TableHead>Heater nights</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {heaterIndex.map((r) => (
                                    <TableRow key={r.playerId}>
                                        <TableCell className="sticky left-0 bg-background font-medium">
                                            {r.name}
                                        </TableCell>
                                        <TableCell>
                                            {r.heaterNightCount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
