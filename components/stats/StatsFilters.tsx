'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import type { StatsFilters as StatsFiltersType } from '@/schemas/statsFilters';

const DATE_OPTIONS = [
    { value: 'all', label: 'All time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' }
] as const;

const ROLLING_OPTIONS = [5, 10, 20] as const;
const TOP_N_OPTIONS = [3, 5, 10] as const;

type Props = {
    /** Current parsed filters (from server) */
    filters: StatsFiltersType;
    /** Season options for selector */
    seasonOptions: { id: string; name: string }[];
    /** Default min nights from league/config */
    defaultMinNights: number;
    /** Default min buy-in cents from league/config */
    defaultMinBuyInCents: number;
};

function getSearchParamsFromFilters(f: StatsFiltersType): Record<string, string> {
    const p: Record<string, string> = {};
    if (f.dateRange) p.dateRange = String(f.dateRange);
    if (f.dateFrom) p.dateFrom = f.dateFrom;
    if (f.dateTo) p.dateTo = f.dateTo;
    if (f.seasonId) p.seasonId = f.seasonId;
    if (f.rollingNights !== 10) p.rollingNights = String(f.rollingNights);
    if (f.minNightsPlayed != null) p.minNightsPlayed = String(f.minNightsPlayed);
    if (f.minTotalBuyInCents != null) p.minTotalBuyInCents = String(f.minTotalBuyInCents);
    if (f.topN !== 5) p.topN = String(f.topN);
    if (!f.includeGuestPlayers) p.includeGuestPlayers = 'false';
    if (f.includeDraftNights) p.includeDraftNights = 'true';
    return p;
}

export function StatsFilters({
    filters,
    seasonOptions,
    defaultMinNights,
    defaultMinBuyInCents
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const update = useCallback(
        (updates: Partial<StatsFiltersType>) => {
            const next = { ...filters, ...updates };
            const params = new URLSearchParams(searchParams.toString());
            const built = getSearchParamsFromFilters(next);
            Object.entries(built).forEach(([k, v]) => params.set(k, v));
            if (next.seasonId === undefined || next.seasonId === '') {
                params.delete('seasonId');
            }
            const q = params.toString();
            router.push(q ? `?${q}` : window.location.pathname, { scroll: false });
        },
        [filters, router, searchParams]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Date range</DropdownMenuLabel>
                <div className="flex flex-wrap gap-2 p-2">
                    {DATE_OPTIONS.map(({ value, label }) => (
                        <Button
                            key={value}
                            variant={filters.dateRange === value ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => update({ dateRange: value })}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Season</DropdownMenuLabel>
                <div className="p-2">
                    <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filters.seasonId ?? ''}
                        onChange={(e) =>
                            update({ seasonId: e.target.value || undefined })
                        }
                    >
                        <option value="">All seasons</option>
                        {seasonOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-2 p-2">
                    <div>
                        <Label className="text-xs">Rolling window (form)</Label>
                        <select
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={filters.rollingNights}
                            onChange={(e) =>
                                update({
                                    rollingNights: Number(
                                        e.target.value
                                    ) as 5 | 10 | 20
                                })
                            }
                        >
                            {ROLLING_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    Last {n} nights
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label className="text-xs">Charts top N</Label>
                        <select
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={filters.topN}
                            onChange={(e) =>
                                update({
                                    topN: Number(e.target.value) as 3 | 5 | 10
                                })
                            }
                        >
                            {TOP_N_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    Top {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Eligibility (min)</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div>
                        <Label className="text-xs">Min nights</Label>
                        <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={
                                filters.minNightsPlayed ?? defaultMinNights
                            }
                            onChange={(e) =>
                                update({
                                    minNightsPlayed: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined
                                })
                            }
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Min buy-in ($)</Label>
                        <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={Math.round(
                                (filters.minTotalBuyInCents ?? defaultMinBuyInCents) /
                                    100
                            )}
                            onChange={(e) =>
                                update({
                                    minTotalBuyInCents: e.target.value
                                        ? parseInt(e.target.value, 10) * 100
                                        : undefined
                                })
                            }
                        />
                    </div>
                </div>
                <DropdownMenuSeparator />
                <div className="flex flex-col gap-2 p-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={filters.includeGuestPlayers}
                            onChange={(e) =>
                                update({
                                    includeGuestPlayers: e.target.checked
                                })
                            }
                        />
                        Include guest players
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={filters.includeDraftNights}
                            onChange={(e) =>
                                update({
                                    includeDraftNights: e.target.checked
                                })
                            }
                        />
                        Include draft (open) nights
                    </label>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
