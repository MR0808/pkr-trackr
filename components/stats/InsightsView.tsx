'use client';

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
    HeaterIndexRow
} from '@/types/stats';

type Props = {
    narrative: InsightsNarrative;
    skillRatings: SkillRatingRow[];
    heaterIndex: HeaterIndexRow[];
};

export function InsightsView({
    narrative,
    skillRatings,
    heaterIndex
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

            <Card>
                <CardHeader>
                    <CardTitle>Projection</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Coming soon: season projection
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
