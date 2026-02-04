'use client';

import { useState } from 'react';
import { ResultsList, SORT_OPTIONS, type SortKey } from '@/components/games/view/ResultsList';
import { ShareButton } from '@/components/ui/share-button';
import type { GameTotals } from '@/types/games';
import type { Player } from '@/types/players';

interface Transaction {
    id: string;
    playerId: string;
    playerName: string;
    type: string;
    amount: number;
    note?: string;
    timestamp: Date | string;
}

interface ResultsSectionProps {
    game: {
        id: string;
        name: string;
        players: Player[];
        transactions: Transaction[];
    };
    totals: GameTotals;
    shareId: string | null;
}

export function ResultsSection({ game, totals, shareId }: ResultsSectionProps) {
    const [sortBy, setSortBy] = useState<SortKey>('profit');

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold lg:text-2xl">Results</h3>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-muted-foreground">Sort by</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortKey)}
                            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Sort results by"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {shareId && <ShareButton shareId={shareId} />}
                </div>
            </div>
            <ResultsList game={game} totals={totals} sortBy={sortBy} setSortBy={setSortBy} />
        </>
    );
}
