'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/money';
import type { SeasonTableRow } from '@/types/stats';
import type { StatsFilters } from '@/schemas/statsFilters';

type Props = {
    seasons: SeasonTableRow[];
    filters: StatsFilters;
    groupId: string;
};

export function SeasonsStatsView({ seasons, filters, groupId }: Props) {
    const router = useRouter();
    if (seasons.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No seasons in this range.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="overflow-x-auto p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background min-w-[140px]">
                                Season
                            </TableHead>
                            <TableHead>Date range</TableHead>
                            <TableHead>Nights</TableHead>
                            <TableHead>Total pot</TableHead>
                            <TableHead>Avg pot</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Most profitable</TableHead>
                            <TableHead>Best ROI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {seasons.map((row) => (
                            <TableRow
                                key={row.seasonId}
                                className="cursor-pointer"
                                onClick={() =>
                                    router.push(
                                        `/stats/seasons/${row.seasonId}`
                                    )
                                }
                            >
                                <TableCell className="sticky left-0 bg-background font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {format(row.startsAt, 'MMM d, yyyy')}
                                        {row.endsAt
                                            ? ` – ${format(row.endsAt, 'MMM d, yyyy')}`
                                            : ''}
                                    </TableCell>
                                    <TableCell>{row.nights}</TableCell>
                                    <TableCell>
                                        {formatCurrency(row.totalPotCents / 100)}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(row.avgPotCents / 100)}
                                    </TableCell>
                                    <TableCell>
                                        {row.playersParticipated}
                                    </TableCell>
                                    <TableCell>
                                        {row.mostProfitablePlayerName != null ? (
                                            <>
                                                {row.mostProfitablePlayerName}{' '}
                                                (
                                                {formatCurrency(
                                                    (row.mostProfitableProfitCents ?? 0) / 100
                                                )}
                                                )
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.bestRoiPlayerName != null &&
                                        row.bestRoi != null ? (
                                            <>
                                                {row.bestRoiPlayerName}{' '}
                                                ({formatPercent(row.bestRoi)})
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
