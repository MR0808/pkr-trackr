'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCurrency,
    formatCurrencyWithSign,
    formatPercent
} from '@/lib/money';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { GameTotals } from '@/types/games';
import type { Player } from '@/types/players';

export type SortKey =
    | 'nightScore'
    | 'profit'
    | 'cashout'
    | 'buyIns'
    | 'roi'
    | 'tableShare'
    | 'potWeightedScore'
    | 'name';

interface Transaction {
    id: string;
    playerId: string;
    playerName: string;
    type: string;
    amount: number;
    note?: string;
    timestamp: Date | string;
}

interface ResultsListProps {
    game: {
        id: string;
        name: string;
        players: Player[];
        transactions: Transaction[];
    };
    totals: GameTotals;
    sortBy: SortKey;
    setSortBy: (key: SortKey) => void;
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'nightScore', label: 'Night Score' },
    { value: 'profit', label: 'Profit' },
    { value: 'cashout', label: 'Cashout' },
    { value: 'buyIns', label: 'Buy-ins' },
    { value: 'roi', label: 'ROI' },
    { value: 'tableShare', label: 'Table Share' },
    { value: 'potWeightedScore', label: 'Pot-Weighted Score' },
    { value: 'name', label: 'Name (A–Z)' }
];

function getSortValue(
    key: SortKey,
    player: Player,
    nightPot: number
): number | string | null {
    const profit = player.net;
    const cashout = player.cashout ?? 0;
    const buyIn = player.buyInsTotal;
    const roi = buyIn > 0 ? profit / buyIn : null;
    const nightScore = roi !== null ? roi * Math.sqrt(buyIn) : null;
    const tableShare = nightPot > 0 ? profit / nightPot : null;
    const potWeightedNightScore =
        nightScore !== null ? nightScore * (nightPot / 100) : null;

    switch (key) {
        case 'profit':
            return profit;
        case 'cashout':
            return cashout;
        case 'buyIns':
            return buyIn;
        case 'roi':
            return roi;
        case 'nightScore':
            return nightScore;
        case 'tableShare':
            return tableShare;
        case 'potWeightedScore':
            return potWeightedNightScore;
        case 'name':
            return player.name.toLowerCase();
        default:
            return null;
    }
}

function formatSortValue(
    key: SortKey,
    value: number | string | null,
    profit: number
): string {
    if (key === 'name') return formatCurrencyWithSign(profit);
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    switch (key) {
        case 'profit':
        case 'cashout':
        case 'buyIns':
            return formatCurrency(value);
        case 'roi':
        case 'tableShare':
            return formatPercent(value);
        case 'nightScore':
        case 'potWeightedScore':
            return value.toFixed(1);
        default:
            return String(value);
    }
}

export function ResultsList({
    game,
    totals,
    sortBy,
    setSortBy
}: ResultsListProps) {
    const nightPot = totals.totalIn;

    const sortedPlayers = useMemo(() => {
        const players = [...game.players];
        players.sort((a, b) => {
            const va = getSortValue(sortBy, a, nightPot);
            const vb = getSortValue(sortBy, b, nightPot);
            const aNull = va === null || va === undefined;
            const bNull = vb === null || vb === undefined;
            if (aNull && bNull) return 0;
            if (aNull) return 1;
            if (bNull) return -1;
            if (sortBy === 'name') {
                return (va as string).localeCompare(vb as string);
            }
            return (vb as number) - (va as number);
        });
        return players;
    }, [game.players, sortBy, nightPot]);

    const summaryRows = useMemo(() => {
        return sortedPlayers.map((player) => {
            const profit = player.net;
            const buyIn = player.buyInsTotal;
            const roi = buyIn > 0 ? profit / buyIn : null;
            const nightScore = roi !== null ? roi * Math.sqrt(buyIn) : null;
            const tableShare = nightPot > 0 ? profit / nightPot : null;
            const potWeightedNightScore =
                nightScore !== null ? nightScore * (nightPot / 100) : null;
            return {
                player,
                profit,
                roi,
                nightScore,
                tableShare,
                potWeightedNightScore
            };
        });
    }, [sortedPlayers, nightPot]);

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Summary table - 1/4 width, sticky */}
            <aside className="shrink-0 lg:sticky lg:top-4 lg:w-1/3 lg:self-start">
                <div className="rounded-lg border bg-card p-2 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Summary
                    </p>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b text-xs">
                                <TableHead className="h-8 w-6 p-1 text-center">
                                    #
                                </TableHead>
                                <TableHead className="h-8 truncate p-1 text-left text-muted-foreground">
                                    Name
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    BI
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    CO
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    P
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    ROI
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    NS
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    TS
                                </TableHead>
                                <TableHead className="h-8 p-1 text-right tabular-nums text-muted-foreground">
                                    PWS
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summaryRows.map((row, index) => (
                                <TableRow
                                    key={row.player.id}
                                    className="border-b text-xs last:border-0"
                                >
                                    <TableCell className="w-6 p-1 text-center tabular-nums text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell
                                        className="max-w-16 truncate p-1 font-medium"
                                        title={row.player.name}
                                    >
                                        {row.player.name}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.player.buyInsTotal >= 0
                                                ? 'text-[hsl(var(--success))]'
                                                : 'text-destructive'
                                        )}
                                    >
                                        {formatCurrencyWithSign(
                                            row.player.buyInsTotal
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            (row.player.cashout ?? 0) >= 0
                                                ? 'text-[hsl(var(--success))]'
                                                : 'text-destructive'
                                        )}
                                    >
                                        {formatCurrencyWithSign(
                                            row.player.cashout ?? 0
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.profit >= 0
                                                ? 'text-[hsl(var(--success))]'
                                                : 'text-destructive'
                                        )}
                                    >
                                        {formatCurrencyWithSign(row.profit)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.roi != null
                                                ? row.roi >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                                : 'text-foreground'
                                        )}
                                    >
                                        {row.roi != null
                                            ? formatPercent(row.roi, 0)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.nightScore != null
                                                ? row.nightScore >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                                : 'text-foreground'
                                        )}
                                    >
                                        {row.nightScore != null
                                            ? row.nightScore.toFixed(1)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.tableShare != null
                                                ? row.tableShare >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                                : 'text-foreground'
                                        )}
                                    >
                                        {row.tableShare != null
                                            ? formatPercent(row.tableShare, 0)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'p-1 text-right tabular-nums',
                                            row.potWeightedNightScore != null
                                                ? row.potWeightedNightScore >= 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive'
                                                : 'text-foreground'
                                        )}
                                    >
                                        {row.potWeightedNightScore != null
                                            ? row.potWeightedNightScore.toFixed(
                                                  1
                                              )
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                        BI=Buy-in · CO-Cashout · P=Profit · ROI · NS=Night Score
                        · TS=Table Share · PWS=Pot-Weighted
                    </p>
                </div>
            </aside>

            {/* Results cards - 3/4 width */}
            <div className="min-w-0 flex-1 lg:w-1/3">
                <div className="space-y-3">
                    {sortedPlayers.map((player, index) => {
                        const profit = player.net;
                        const buyIn = player.buyInsTotal;
                        const roi = buyIn > 0 ? profit / buyIn : null;
                        const nightScore =
                            roi !== null ? roi * Math.sqrt(buyIn) : null;
                        const tableShare =
                            nightPot > 0 ? profit / nightPot : null;
                        const potWeightedNightScore =
                            nightScore !== null
                                ? nightScore * (nightPot / 100)
                                : null;

                        const netColor =
                            profit > 0
                                ? 'text-[hsl(var(--success))]'
                                : profit < 0
                                ? 'text-destructive'
                                : '';

                        const sortValue = getSortValue(
                            sortBy,
                            player,
                            nightPot
                        );
                        const displayScore = formatSortValue(
                            sortBy,
                            sortValue,
                            profit
                        );

                        const buyInTransactions = game.transactions.filter(
                            (t) =>
                                t.playerId === player.id && t.type === 'BUY_IN'
                        );
                        const adjustmentTransactions = game.transactions.filter(
                            (t) =>
                                t.playerId === player.id &&
                                t.type === 'ADJUSTMENT'
                        );
                        const hasDetails =
                            buyInTransactions.length > 1 ||
                            adjustmentTransactions.length > 0;

                        const timestampDisplay = (ts: Date | string) =>
                            new Date(ts).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            });

                        return (
                            <Card key={player.id} className="rounded-2xl">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                                {index + 1}
                                            </div>
                                            <CardTitle className="truncate text-lg lg:text-xl">
                                                {player.name}
                                            </CardTitle>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {sortBy === 'name'
                                                    ? 'Profit'
                                                    : SORT_OPTIONS.find(
                                                          (o) =>
                                                              o.value === sortBy
                                                      )?.label ?? sortBy}
                                            </span>
                                            <span
                                                className={cn(
                                                    'tabular-nums text-2xl font-bold lg:text-3xl',
                                                    sortBy === 'profit' ||
                                                        sortBy === 'name'
                                                        ? netColor
                                                        : sortBy === 'roi' ||
                                                          sortBy ===
                                                              'tableShare'
                                                        ? profit >= 0
                                                            ? 'text-[hsl(var(--success))]'
                                                            : 'text-destructive'
                                                        : 'text-foreground'
                                                )}
                                            >
                                                {displayScore}
                                            </span>
                                            {sortBy !== 'profit' &&
                                                sortBy !== 'name' && (
                                                    <span
                                                        className={cn(
                                                            'text-sm tabular-nums',
                                                            netColor
                                                        )}
                                                    >
                                                        {formatCurrencyWithSign(
                                                            profit
                                                        )}{' '}
                                                        profit
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex justify-between text-sm text-muted-foreground lg:text-base">
                                        <div>
                                            <span>Buy-ins: </span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {formatCurrency(
                                                    player.buyInsTotal
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span>Cashout: </span>
                                            <span className="tabular-nums font-medium text-foreground">
                                                {player.cashout !== null
                                                    ? formatCurrency(
                                                          player.cashout
                                                      )
                                                    : 'Not set'}
                                            </span>
                                        </div>
                                        {player.adjustmentsTotal !== 0 && (
                                            <div>
                                                <span>Adjustments: </span>
                                                <span className="tabular-nums font-medium text-foreground">
                                                    {formatCurrencyWithSign(
                                                        player.adjustmentsTotal
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Per-night metrics
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Profit
                                                </span>
                                                <p
                                                    className={cn(
                                                        'tabular-nums font-medium',
                                                        netColor
                                                    )}
                                                >
                                                    {formatCurrencyWithSign(
                                                        profit
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Cash-out − Buy-in
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    ROI
                                                </span>
                                                <p className="tabular-nums font-medium text-foreground">
                                                    {roi !== null
                                                        ? formatPercent(roi)
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Return on investment
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Night Score
                                                </span>
                                                <p className="tabular-nums font-medium text-foreground">
                                                    {nightScore !== null
                                                        ? nightScore.toFixed(1)
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ROI × √Buy-in
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Night Pot
                                                </span>
                                                <p className="tabular-nums font-medium text-foreground">
                                                    {formatCurrency(nightPot)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Table total buy-ins
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Table Share
                                                </span>
                                                <p className="tabular-nums font-medium text-foreground">
                                                    {tableShare !== null
                                                        ? formatPercent(
                                                              tableShare
                                                          )
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Share of the pot
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Pot-Weighted Score
                                                </span>
                                                <p className="tabular-nums font-medium text-foreground">
                                                    {potWeightedNightScore !==
                                                    null
                                                        ? potWeightedNightScore.toFixed(
                                                              1
                                                          )
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    For cross-night comparison
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {hasDetails && (
                                        <Accordion
                                            type="single"
                                            collapsible
                                            className="mt-3"
                                        >
                                            <AccordionItem
                                                value="details"
                                                className="border-none"
                                            >
                                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                                    View Details
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2 pt-2">
                                                        {buyInTransactions.length >
                                                            0 && (
                                                            <div>
                                                                <p className="mb-1 text-sm font-medium">
                                                                    Buy-ins:
                                                                </p>
                                                                <div className="space-y-1">
                                                                    {buyInTransactions.map(
                                                                        (t) => (
                                                                            <div
                                                                                key={
                                                                                    t.id
                                                                                }
                                                                                className="flex justify-between text-sm text-muted-foreground"
                                                                            >
                                                                                <span>
                                                                                    {timestampDisplay(
                                                                                        t.timestamp
                                                                                    )}
                                                                                </span>
                                                                                <span className="tabular-nums">
                                                                                    {formatCurrency(
                                                                                        t.amount
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {adjustmentTransactions.length >
                                                            0 && (
                                                            <div>
                                                                <p className="mb-1 text-sm font-medium">
                                                                    Adjustments:
                                                                </p>
                                                                <div className="space-y-1">
                                                                    {adjustmentTransactions.map(
                                                                        (t) => (
                                                                            <div
                                                                                key={
                                                                                    t.id
                                                                                }
                                                                                className="space-y-0.5"
                                                                            >
                                                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                                                    <span>
                                                                                        {timestampDisplay(
                                                                                            t.timestamp
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="tabular-nums">
                                                                                        {formatCurrencyWithSign(
                                                                                            t.amount
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                                {t.note && (
                                                                                    <p className="text-xs italic text-muted-foreground">
                                                                                        {
                                                                                            t.note
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
