'use client';

import Link from 'next/link';
import type { BalancePlayer } from '@/actions/games';
import { formatCurrencyWithSign } from '@/lib/money';
import { cn } from '@/lib/utils';

type Props = {
    players: BalancePlayer[];
};

/** Mini bar chart: profit distribution. Above/below zero visual. */
export function BalanceSnapshot({ players }: Props) {
    if (players.length === 0) return null;

    const maxAbs = Math.max(
        ...players.map((p) => Math.abs(p.totalProfitCents)),
        1
    );

    return (
        <div className="min-w-0 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
                Profit distribution (all-time)
            </p>
            <div className="space-y-2">
                {players
                    .sort((a, b) => b.totalProfitCents - a.totalProfitCents)
                    .map((p) => {
                        const pct =
                            (Math.abs(p.totalProfitCents) / maxAbs) * 100;
                        const isPositive = p.totalProfitCents >= 0;
                        // Cap bar at 50% width so positive stays right of center, negative left
                        const barWidth = Math.min(pct, 50);
                        return (
                            <div
                                key={p.playerId}
                                className="flex items-center gap-2"
                            >
                                <Link
                                    href={`/players/${p.playerId}`}
                                    className="w-24 shrink-0 truncate text-sm font-medium text-primary hover:underline sm:w-28"
                                    title={p.name}
                                >
                                    {p.name}
                                </Link>
                                <div className="relative h-6 min-w-0 flex-1 overflow-hidden rounded bg-muted">
                                    <div
                                        className="absolute top-0 h-full rounded transition-all"
                                        style={{
                                            width: `${barWidth}%`,
                                            left: isPositive ? '50%' : `${50 - barWidth}%`,
                                            backgroundColor: isPositive
                                                ? 'var(--success)'
                                                : 'var(--destructive)'
                                        }}
                                    />
                                </div>
                                <span
                                    className={cn(
                                        'w-16 shrink-0 text-right text-sm tabular-nums',
                                        isPositive
                                            ? 'text-[hsl(var(--success))]'
                                            : 'text-destructive'
                                    )}
                                >
                                    {formatCurrencyWithSign(
                                        p.totalProfitCents / 100
                                    )}
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
