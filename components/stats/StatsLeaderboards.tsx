'use client';

import { useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/types/stats';
import { ArrowDown, ArrowUp } from 'lucide-react';

type SortKey =
    | 'totalProfitCents'
    | 'totalBuyInCents'
    | 'roi'
    | 'seasonScore'
    | 'totalGames'
    | 'nightsWon'
    | 'podiumPoints'
    | 'winRate'
    | 'nightsInProfit';

const COLUMNS: {
    key: SortKey;
    label: string;
    align?: 'right' | 'center';
    hideOnMobile?: boolean;
}[] = [
    { key: 'totalProfitCents', label: 'Profit', align: 'right' },
    { key: 'totalBuyInCents', label: 'Buy-ins', align: 'right', hideOnMobile: true },
    { key: 'roi', label: 'ROI', align: 'right', hideOnMobile: true },
    { key: 'seasonScore', label: 'Score', align: 'right', hideOnMobile: true },
    { key: 'totalGames', label: 'Nights', align: 'right' },
    { key: 'nightsWon', label: 'Won', align: 'right', hideOnMobile: true },
    { key: 'podiumPoints', label: 'Podium', align: 'right', hideOnMobile: true },
    { key: 'winRate', label: 'Win rate', align: 'right', hideOnMobile: true },
    { key: 'nightsInProfit', label: 'In profit', align: 'right', hideOnMobile: true }
];

function getSortValue(p: LeaderboardRow, key: SortKey): number {
    switch (key) {
        case 'totalProfitCents':
            return p.totalProfitCents;
        case 'totalBuyInCents':
            return p.totalBuyInCents;
        case 'roi':
            return p.roi ?? -Infinity;
        case 'seasonScore':
            return p.seasonScore ?? -Infinity;
        case 'totalGames':
            return p.totalGames;
        case 'nightsWon':
            return p.nightsWon;
        case 'podiumPoints':
            return p.podiumPoints;
        case 'winRate':
            return p.winRate;
        case 'nightsInProfit':
            return 'nightsInProfit' in p ? p.nightsInProfit : 0;
        default:
            return 0;
    }
}

export function StatsLeaderboards({
    players,
    scopeLabel = 'Leaderboard'
}: {
    players: LeaderboardRow[];
    scopeLabel?: string;
}) {
    const [sortKey, setSortKey] = useState<SortKey>('totalProfitCents');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const sorted = useMemo(() => {
        return [...players].sort((a, b) => {
            const va = getSortValue(a, sortKey);
            const vb = getSortValue(b, sortKey);
            if (va === vb) return 0;
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [players, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    if (players.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{scopeLabel}</CardTitle>
                    <CardDescription>
                        No closed games yet. Stats use game scheduled date.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="min-w-0">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                {scopeLabel}
            </h2>
            <Card className="min-w-0 overflow-hidden">
                <CardContent className="min-w-0 p-0">
                    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] sm:overflow-visible">
                        <Table className="w-full min-w-0 sm:min-w-[700px]">
                            <TableHeader>
                                <TableRow className="border-b">
                                    <TableHead className="w-10 shrink-0 text-center">#</TableHead>
                                    <TableHead className="min-w-0">Player</TableHead>
                                    {COLUMNS.map(({ key, label, align, hideOnMobile }) => (
                                        <TableHead
                                            key={key}
                                            className={cn(
                                                align === 'right' && 'text-right tabular-nums',
                                                'cursor-pointer select-none whitespace-nowrap hover:bg-muted/50',
                                                sortKey === key && 'bg-muted/50',
                                                hideOnMobile && 'hidden sm:table-cell'
                                            )}
                                            onClick={() => handleSort(key)}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {label}
                                                {sortKey === key ? (
                                                    sortDir === 'desc' ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    )
                                                ) : null}
                                            </span>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((p, i) => (
                                    <TableRow
                                        key={p.playerId}
                                        className="border-b last:border-0"
                                    >
                                        <TableCell className="w-10 shrink-0 text-center text-muted-foreground">
                                            {i + 1}
                                        </TableCell>
                                        <TableCell className="min-w-0 font-medium">
                                            <span className="truncate">{p.name}</span>
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                'shrink-0 text-right tabular-nums',
                                                p.totalProfitCents >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                            )}
                                        >
                                            {formatCurrencyWithSign(
                                                p.totalProfitCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {formatCurrency(
                                                p.totalBuyInCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {p.roi != null
                                                ? formatPercent(p.roi)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {p.seasonScore != null
                                                ? p.seasonScore.toFixed(1)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="shrink-0 text-right tabular-nums text-muted-foreground">
                                            {p.totalGames}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {p.nightsWon}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {p.podiumPoints}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                            {formatPercent(p.winRate)}
                                        </TableCell>
                                        <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                                            {'nightsInProfit' in p && p.nightsInProfit != null
                                                ? `${p.nightsInProfit} / ${p.totalGames}`
                                                : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <p className="mt-2 px-4 pb-4 text-xs text-muted-foreground sm:px-6 sm:pb-6">
                Score = ROI × √(buy-in). Podium: 3 pts 1st, 2 pts 2nd, 1 pt 3rd per night. In profit = nights with positive result. Click a column header to sort.
            </p>
        </div>
    );
}
