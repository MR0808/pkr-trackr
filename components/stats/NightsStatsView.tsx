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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/money';
import type { NightTableRow } from '@/types/stats';
import type { StatsFilters } from '@/schemas/statsFilters';

type Props = {
    nights: NightTableRow[];
    filters: StatsFilters;
};

export function NightsStatsView({ nights }: Props) {
    const router = useRouter();
    if (nights.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No nights in this range.
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
                            <TableHead className="sticky left-0 bg-background min-w-[100px]">
                                Date
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pot</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Biggest winner</TableHead>
                            <TableHead>Biggest loser</TableHead>
                            <TableHead>Rebuys</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {nights.map((row) => (
                            <TableRow
                                key={row.gameId}
                                className="cursor-pointer"
                                onClick={() =>
                                    router.push(
                                        `/games/${row.gameId}/results`
                                    )
                                }
                            >
                                <TableCell className="sticky left-0 bg-background font-medium whitespace-nowrap">
                                        {format(row.date, 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                row.status === 'CLOSED'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {row.status === 'CLOSED'
                                                ? 'FINAL'
                                                : 'DRAFT'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(row.potCents / 100)}
                                    </TableCell>
                                    <TableCell>{row.playersCount}</TableCell>
                                    <TableCell>
                                        {row.biggestWinnerName != null ? (
                                            <>
                                                {row.biggestWinnerName}{' '}
                                                (
                                                {formatCurrencyWithSign(
                                                    (row.biggestWinnerProfitCents ?? 0) /
                                                        100
                                                )}
                                                )
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.biggestLoserName != null &&
                                        row.biggestLoserLossCents != null ? (
                                            <>
                                                {row.biggestLoserName}{' '}
                                                (
                                                {formatCurrency(
                                                    row.biggestLoserLossCents /
                                                        100
                                                )}
                                                )
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>{row.rebuysCount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
