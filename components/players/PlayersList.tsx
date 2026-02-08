'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import type { PlayersListPageData } from '@/actions/playerActions';
import { ArrowDown, ArrowUp, UserCircle } from 'lucide-react';

type SortKey =
    | 'name'
    | 'totalProfitCents'
    | 'totalBuyInCents'
    | 'roi'
    | 'totalGames'
    | 'nightsWon'
    | 'podiumPoints'
    | 'winRate'
    | 'nightsInProfit';

const COLUMNS: {
    key: SortKey;
    label: string;
    align?: 'right';
    hideOnMobile?: boolean;
}[] = [
    { key: 'name', label: 'Player' },
    { key: 'totalProfitCents', label: 'Profit', align: 'right' },
    { key: 'totalBuyInCents', label: 'Buy-ins', align: 'right', hideOnMobile: true },
    { key: 'roi', label: 'ROI', align: 'right', hideOnMobile: true },
    { key: 'totalGames', label: 'Nights', align: 'right' },
    { key: 'nightsWon', label: 'Won', align: 'right', hideOnMobile: true },
    { key: 'podiumPoints', label: 'Podium', align: 'right', hideOnMobile: true },
    { key: 'winRate', label: 'Win rate', align: 'right', hideOnMobile: true },
    { key: 'nightsInProfit', label: 'In profit', align: 'right', hideOnMobile: true }
];

function getSortValue(
    p: PlayersListPageData['players'][0],
    key: SortKey
): number | string {
    if (key === 'name') return p.name;
    switch (key) {
        case 'totalProfitCents':
            return p.totalProfitCents;
        case 'totalBuyInCents':
            return p.totalBuyInCents;
        case 'roi':
            return p.roi ?? -Infinity;
        case 'totalGames':
            return p.totalGames;
        case 'nightsWon':
            return p.nightsWon;
        case 'podiumPoints':
            return p.podiumPoints;
        case 'winRate':
            return p.winRate;
        case 'nightsInProfit':
            return p.nightsInProfit;
        default:
            return 0;
    }
}

export function PlayersList({
    data
}: {
    data: PlayersListPageData | null;
}) {
    const [sortKey, setSortKey] = useState<SortKey>('totalProfitCents');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const players = data?.players ?? [];
    const sorted = useMemo(() => {
        return [...players].sort((a, b) => {
            const va = getSortValue(a, sortKey);
            const vb = getSortValue(b, sortKey);
            if (va === vb) return 0;
            if (sortKey === 'name') {
                const cmp = String(va).localeCompare(String(vb));
                return sortDir === 'asc' ? cmp : -cmp;
            }
            return sortDir === 'asc'
                ? (va as number) - (vb as number)
                : (vb as number) - (va as number);
        });
    }, [players, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'name' ? 'asc' : 'desc');
        }
    };

    if (!data) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Failed to load players.
                </CardContent>
            </Card>
        );
    }

    if (players.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No players yet</CardTitle>
                    <CardDescription>
                        Players are added when you add them to a game. Create a
                        game and add players to get started.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                    All players ({players.length})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Click a player to see their profile and recent games. Sorted
                    by profit (best first); click a column header to sort.
                </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 p-0">
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] sm:overflow-visible">
                    <Table className="w-full min-w-0 sm:min-w-[700px]">
                        <TableHeader>
                            <TableRow className="border-b">
                                <TableHead className="w-10 shrink-0 text-center">#</TableHead>
                                {COLUMNS.map(({ key, label, align, hideOnMobile }) => (
                                    <TableHead
                                        key={key}
                                        className={cn(
                                            align === 'right' &&
                                                'text-right tabular-nums',
                                            'cursor-pointer select-none whitespace-nowrap hover:bg-muted/50',
                                            sortKey === key && 'bg-muted/50',
                                            hideOnMobile && 'hidden sm:table-cell'
                                        )}
                                        onClick={() => handleSort(key)}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {label}
                                            {sortKey === key
                                                ? sortDir === 'desc'
                                                    ? (
                                                          <ArrowDown className="h-3.5 w-3.5" />
                                                      )
                                                    : (
                                                          <ArrowUp className="h-3.5 w-3.5" />
                                                      )
                                                : null}
                                        </span>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((p, i) => (
                                <TableRow
                                    key={p.id}
                                    className="border-b last:border-0 hover:bg-muted/30"
                                >
                                    <TableCell className="w-10 shrink-0 text-center text-muted-foreground">
                                        {i + 1}
                                    </TableCell>
                                    <TableCell className="min-w-0 font-medium sm:min-w-[120px]">
                                        <Link
                                            href={`/players/${p.id}`}
                                            className="inline-flex items-center gap-2 hover:underline"
                                        >
                                            <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{p.name}</span>
                                        </Link>
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
                                        {p.nightsInProfit} / {p.totalGames}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
