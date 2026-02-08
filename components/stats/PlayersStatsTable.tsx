'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import type { PlayerStatsRow, RollingFormRow } from '@/types/stats';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';

type SortKey =
    | 'name'
    | 'nightsPlayed'
    | 'totalBuyInCents'
    | 'totalProfitCents'
    | 'roi'
    | 'performanceScore'
    | 'winRate'
    | 'bestNightProfitCents'
    | 'worstNightLossCents';

const PAGE_SIZE = 15;

type Props = {
    initialData: { players: PlayerStatsRow[]; totalCount: number };
    filters: { topN: number; rollingNights: number };
    groupId: string;
    rollingForm: RollingFormRow[];
};

export function PlayersStatsTable({
    initialData,
    filters,
    rollingForm
}: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalProfitCents');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        let list = initialData.players;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [initialData.players, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let va: number | string = 0;
            let vb: number | string = 0;
            switch (sortKey) {
                case 'name':
                    va = a.name;
                    vb = b.name;
                    return sortDir === 'asc'
                        ? String(va).localeCompare(String(vb))
                        : String(vb).localeCompare(String(va));
                case 'nightsPlayed':
                    va = a.nightsPlayed;
                    vb = b.nightsPlayed;
                    break;
                case 'totalBuyInCents':
                    va = a.totalBuyInCents;
                    vb = b.totalBuyInCents;
                    break;
                case 'totalProfitCents':
                    va = a.totalProfitCents;
                    vb = b.totalProfitCents;
                    break;
                case 'roi':
                    va = a.roi ?? -Infinity;
                    vb = b.roi ?? -Infinity;
                    break;
                case 'performanceScore':
                    va = a.performanceScore ?? -Infinity;
                    vb = b.performanceScore ?? -Infinity;
                    break;
                case 'winRate':
                    va = a.winRate;
                    vb = b.winRate;
                    break;
                case 'bestNightProfitCents':
                    va = a.bestNightProfitCents ?? -Infinity;
                    vb = b.bestNightProfitCents ?? -Infinity;
                    break;
                case 'worstNightLossCents':
                    va = a.worstNightLossCents ?? Infinity;
                    vb = b.worstNightLossCents ?? Infinity;
                    break;
                default:
                    return 0;
            }
            const diff = (va as number) - (vb as number);
            return sortDir === 'asc' ? diff : -diff;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortKey(key);
            setSortDir(
                key === 'name' || key === 'worstNightLossCents' ? 'asc' : 'desc'
            );
        }
        setPage(0);
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return null;
        return sortDir === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4 inline" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4 inline" />
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Players</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="max-w-[200px] sm:max-w-xs"
                        />
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="sticky left-0 z-10 min-w-[120px] bg-background"
                                    onClick={() => toggleSort('name')}
                                >
                                    Player <SortIcon column="name" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('nightsPlayed')}
                                >
                                    Nights <SortIcon column="nightsPlayed" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('totalBuyInCents')}
                                >
                                    Buy-in <SortIcon column="totalBuyInCents" />
                                </TableHead>
                                <TableHead>Cash-out</TableHead>
                                <TableHead
                                    onClick={() => toggleSort('totalProfitCents')}
                                >
                                    Profit <SortIcon column="totalProfitCents" />
                                </TableHead>
                                <TableHead onClick={() => toggleSort('roi')}>
                                    ROI <SortIcon column="roi" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('performanceScore')}
                                >
                                    Score <SortIcon column="performanceScore" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('winRate')}
                                >
                                    Win rate <SortIcon column="winRate" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('bestNightProfitCents')}
                                >
                                    Best night <SortIcon column="bestNightProfitCents" />
                                </TableHead>
                                <TableHead
                                    onClick={() => toggleSort('worstNightLossCents')}
                                >
                                    Worst night <SortIcon column="worstNightLossCents" />
                                </TableHead>
                                <TableHead>Eligibility</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageRows.map((row) => (
                                <TableRow
                                    key={row.playerId}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        router.push(`/players/${row.playerId}`)
                                    }
                                >
                                    <TableCell className="sticky left-0 z-10 min-w-[120px] bg-background font-medium">
                                            {row.name}
                                        </TableCell>
                                        <TableCell>{row.nightsPlayed}</TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                row.totalBuyInCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                row.totalCashOutCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrencyWithSign(
                                                row.totalProfitCents / 100
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.roi != null
                                                ? formatPercent(row.roi)
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.performanceScore != null
                                                ? row.performanceScore.toFixed(1)
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {formatPercent(row.winRate)}
                                        </TableCell>
                                        <TableCell>
                                            {row.bestNightProfitCents != null
                                                ? formatCurrencyWithSign(
                                                      row.bestNightProfitCents /
                                                          100
                                                  )
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.worstNightLossCents != null
                                                ? formatCurrencyWithSign(
                                                      -row.worstNightLossCents /
                                                          100
                                                  )
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.meetsEligibility ? (
                                                <Badge variant="secondary">
                                                    Eligible
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Min
                                                </Badge>
                                            )}
                                        </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-6 py-3">
                        <p className="text-sm text-muted-foreground">
                            {sorted.length} players
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="flex items-center px-2 text-sm">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(totalPages - 1, p + 1)
                                    )}
                                disabled={page >= totalPages - 1}
                                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {rollingForm.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Form (last {filters.rollingNights} nights)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Top 10 by profit in the rolling window
                        </p>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background">
                                        Player
                                    </TableHead>
                                    <TableHead>Profit (last N)</TableHead>
                                    <TableHead>ROI (last N)</TableHead>
                                    <TableHead>Trend</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rollingForm.map((r) => (
                                    <TableRow key={r.playerId}>
                                        <TableCell className="sticky left-0 bg-background font-medium">
                                            {r.name}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrencyWithSign(
                                                r.profitLastN / 100
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {r.roiLastN != null
                                                ? formatPercent(r.roiLastN)
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {r.trendDirection === 'up' && (
                                                <ArrowUp className="h-4 w-4 text-green-600" />
                                            )}
                                            {r.trendDirection === 'down' && (
                                                <ArrowDown className="h-4 w-4 text-red-600" />
                                            )}
                                            {r.trendDirection === 'flat' && (
                                                <Minus className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
