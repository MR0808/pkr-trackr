'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { Player } from '@/types/players';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/money';
import { addBuyInAction } from '@/actions/games';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlayerCardProps {
    player: Player;
    gameId: string;
    isGameClosed: boolean;
    onCustomBuyIn: () => void;
    onCashout: () => void;
    onAdjustment: () => void;
    // Optional overrides used for optimistic UI from a parent component
    optimisticOverride?: {
        buyInsTotal?: number;
        cashout?: number | null;
        adjustmentsTotal?: number;
        net?: number;
    };
    // Callbacks to trigger optimistic updates managed by the parent
    onApplyOptimisticBuyIn?: (playerId: string, amount: number) => void;
    onRevertOptimistic?: (playerId: string) => void;
    onFinalizeOptimistic?: (playerId: string) => void;
    // When true this is an optimistic temporary player (show 'Adding…')
    isTemporary?: boolean;
}

const PRESET_AMOUNTS = [20, 50, 100];

export function PlayerCard({
    player,
    gameId,
    isGameClosed,
    onCustomBuyIn,
    onCashout,
    onAdjustment,
    optimisticOverride,
    onApplyOptimisticBuyIn,
    onRevertOptimistic,
    onFinalizeOptimistic,
    isTemporary
}: PlayerCardProps) {
    const [isPending, startTransition] = useTransition();

    // Derive displayed values from either optimistic overrides (provided by parent)
    // or authoritative server props. net = result = cashout - buyin (positive = won)
    const effectiveBuyInsTotal =
        optimisticOverride?.buyInsTotal ?? player.buyInsTotal;
    const effectiveCashout = optimisticOverride?.cashout ?? player.cashout;
    const effectiveAdjustmentsTotal =
        optimisticOverride?.adjustmentsTotal ?? player.adjustmentsTotal;
    const effectiveNet =
        optimisticOverride?.net ??
        (effectiveCashout ?? 0) - effectiveBuyInsTotal - effectiveAdjustmentsTotal;

    const handlePresetBuyIn = (amount: number) => {
        // Ask parent to apply an optimistic update (fast UI) before the server round-trip
        onApplyOptimisticBuyIn?.(player.id, amount);

        startTransition(async () => {
            const result = await addBuyInAction({
                gameId,
                playerId: player.id,
                amount
            });

            if (result.success) {
                toast('Buy-in added', {
                    description: `${formatCurrency(amount)} added for ${player.name}`
                });

                // Let parent finalize optimistic state and refresh server data if desired
                onFinalizeOptimistic?.(player.id);
            } else {
                // revert optimistic state via parent if available
                onRevertOptimistic?.(player.id);

                toast.error('Error', {
                    description: result.error || 'Failed to add buy-in'
                });
            }
        });
    };

    const netColor =
        effectiveNet > 0
            ? 'text-[hsl(var(--success))]'
            : effectiveNet < 0
              ? 'text-destructive'
              : '';

    return (
        <Card
            className={`flex min-h-32 flex-col justify-between rounded-2xl transition-colors ${
                isTemporary ? 'opacity-95 ring-1 ring-border bg-muted/5' : ''
            }`}
        >
            <CardHeader className="pb-1">
                <div className="flex items-start justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold lg:text-xl">
                        <Link
                            href={`/players/${player.id}`}
                            className="text-primary hover:underline"
                        >
                            {player.name}
                        </Link>
                        {isTemporary && (
                            <span className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="tabular-nums text-xs lg:text-sm opacity-85 animate-pulse"
                                    title="Being added"
                                    role="status"
                                    aria-label="Being added"
                                >
                                    Adding…
                                </Badge>
                                <Loader2
                                    aria-hidden
                                    className="h-3 w-3 text-muted-foreground animate-spin"
                                />
                            </span>
                        )}
                    </h3>
                    <Badge
                        variant={effectiveNet >= 0 ? 'default' : 'destructive'}
                        className="tabular-nums text-sm lg:text-base"
                    >
                        {formatCurrencyWithSign(effectiveNet)}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-2">
                <div
                    className={cn(
                        'tabular-nums text-xl font-bold lg:text-2xl',
                        netColor
                    )}
                >
                    {formatCurrencyWithSign(effectiveNet)}
                </div>
                <div className="mt-0.5 space-y-0.5 text-sm text-muted-foreground lg:text-sm">
                    <div>
                        Buy-ins:{' '}
                        <span className="tabular-nums">
                            {formatCurrency(effectiveBuyInsTotal)}
                        </span>
                    </div>
                    <div>
                        Cashout:{' '}
                        <span className="tabular-nums">
                            {effectiveCashout !== null
                                ? formatCurrency(effectiveCashout)
                                : 'Not set'}
                        </span>
                    </div>
                    {effectiveAdjustmentsTotal !== 0 && (
                        <div>
                            Adjustments:{' '}
                            <span className="tabular-nums">
                                {formatCurrencyWithSign(
                                    effectiveAdjustmentsTotal
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-1">
                <div className="flex w-full gap-2">
                    {PRESET_AMOUNTS.map((amount) => (
                        <Button
                            key={amount}
                            variant="secondary"
                            size="sm"
                            disabled={isGameClosed || isPending}
                            onClick={() => handlePresetBuyIn(amount)}
                            className="h-10 flex-1 rounded-lg text-sm lg:h-12 lg:text-base"
                        >
                            +{amount}
                        </Button>
                    ))}
                </div>
                <div className="flex w-full gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isGameClosed || isPending}
                        onClick={onCustomBuyIn}
                        className="h-10 flex-1 rounded-lg text-sm lg:h-12 lg:text-base bg-transparent"
                    >
                        Custom
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        disabled={isGameClosed || isPending}
                        onClick={onCashout}
                        className="h-10 flex-1 rounded-lg text-sm lg:h-12 lg:text-base"
                    >
                        {player.cashout !== null
                            ? 'Edit Cashout'
                            : 'Set Cashout'}
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isGameClosed || isPending}
                    onClick={onAdjustment}
                    className="h-9 w-full rounded-lg text-sm"
                >
                    Adjustment
                </Button>
            </CardFooter>
        </Card>
    );
}
