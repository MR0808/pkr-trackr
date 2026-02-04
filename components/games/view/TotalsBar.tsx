import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/money';
import type { GameTotals } from '@/types/games';
import { cn } from '@/lib/utils';

interface TotalsTileProps {
    label: string;
    amount: number;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function TotalsTile({ label, amount, variant = 'default' }: TotalsTileProps) {
    return (
        <Card
            className={cn(
                'flex min-h-21 flex-col justify-center p-4 lg:p-5',
                variant === 'success' && 'border-[hsl(var(--success))]',
                variant === 'warning' && 'border-[hsl(var(--warning))]',
                variant === 'destructive' && 'border-destructive'
            )}
        >
            <div className="text-sm text-muted-foreground lg:text-base">
                {label}
            </div>
            <div
                className={cn(
                    'tabular-nums text-xl font-semibold lg:text-2xl',
                    variant === 'success' && 'text-[hsl(var(--success))]',
                    variant === 'warning' && 'text-[hsl(var(--warning))]',
                    variant === 'destructive' && 'text-destructive'
                )}
            >
                {formatCurrency(amount)}
            </div>
        </Card>
    );
}

interface CountTileProps {
    label: string;
    count: number;
}

function CountTile({ label, count }: CountTileProps) {
    return (
        <Card className="flex min-h-21 flex-col justify-center p-4 lg:p-5">
            <div className="text-sm text-muted-foreground lg:text-base">
                {label}
            </div>
            <div className="tabular-nums text-xl font-semibold lg:text-2xl">
                {count}
            </div>
        </Card>
    );
}

interface TotalsBarProps {
    totals: GameTotals;
    playerCount?: number;
}

export function TotalsBar({ totals, playerCount }: TotalsBarProps) {
    const bankDeltaVariant =
        totals.bankDelta === 0
            ? 'success'
            : totals.bankDelta > 0
              ? 'warning'
              : 'destructive';

    const bankDeltaLabel =
        totals.bankDelta === 0
            ? 'Balanced'
            : totals.bankDelta > 0
              ? 'Cash Remaining'
              : 'Overpaid';

    const hasPlayerCount = playerCount !== undefined;
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4',
                hasPlayerCount ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            )}
        >
            <TotalsTile label="Total In" amount={totals.totalIn} />
            <TotalsTile label="Total Out" amount={totals.totalOut} />
            <TotalsTile
                label={`Bank Delta • ${bankDeltaLabel}`}
                amount={totals.bankDelta}
                variant={bankDeltaVariant}
            />
            {playerCount !== undefined && (
                <CountTile label="Players" count={playerCount} />
            )}
        </div>
    );
}
