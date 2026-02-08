'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Undo2, Pencil, Wallet, ArrowDownUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Transaction } from '@/types/games';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/money';
import { undoTransactionAction } from '@/actions/games';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
    transactions: Transaction[];
    gameId: string;
    isGameClosed: boolean;
    onEditCashout?: (transaction: Transaction) => void;
}

export function ActivityFeed({
    transactions,
    gameId,
    isGameClosed,
    onEditCashout
}: ActivityFeedProps) {
    const [isPending, startTransition] = useTransition();

    const handleUndo = (transactionId: string) => {
        startTransition(async () => {
            const result = await undoTransactionAction({
                gameId,
                transactionId
            });

            if (result.success) {
                toast('Transaction undone', {
                    description: 'The transaction has been removed'
                });
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to undo transaction'
                });
            }
        });
    };

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'BUY_IN':
                return <Wallet className="h-4 w-4" />;
            case 'CASHOUT':
                return <Wallet className="h-4 w-4" />;
            case 'ADJUSTMENT':
                return <ArrowDownUp className="h-4 w-4" />;
        }
    };

    const getTransactionText = (transaction: Transaction) => {
        switch (transaction.type) {
            case 'BUY_IN':
                return 'bought in';
            case 'CASHOUT':
                return 'cashed out';
            case 'ADJUSTMENT':
                return 'adjustment';
        }
    };

    if (transactions.length === 0) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-lg lg:text-xl">
                        Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-muted-foreground">
                        No activity yet
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle className="text-lg lg:text-xl">Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-100 lg:h-150">
                    <div className="space-y-2 p-4 pt-0">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between gap-2 rounded-lg border p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="text-muted-foreground">
                                        {getTransactionIcon(transaction.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-1 text-sm lg:text-base">
                                            <Link
                                                href={`/players/${transaction.playerId}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {transaction.playerName}
                                            </Link>
                                            <span className="text-muted-foreground">
                                                {getTransactionText(
                                                    transaction
                                                )}
                                            </span>
                                        </div>
                                        {transaction.note && (
                                            <p className="text-xs text-muted-foreground">
                                                {transaction.note}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'tabular-nums text-base font-semibold lg:text-lg',
                                            transaction.type === 'ADJUSTMENT' &&
                                                (transaction.amount > 0
                                                    ? 'text-[hsl(var(--success))]'
                                                    : 'text-destructive')
                                        )}
                                    >
                                        {transaction.type === 'ADJUSTMENT'
                                            ? formatCurrencyWithSign(
                                                  transaction.amount
                                              )
                                            : formatCurrency(
                                                  transaction.amount
                                              )}
                                    </div>

                                    {!isGameClosed && (
                                        <>
                                            {transaction.type === 'CASHOUT' &&
                                                onEditCashout && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            onEditCashout(
                                                                transaction
                                                            )
                                                        }
                                                        disabled={isPending}
                                                        className="h-10 w-10 rounded-xl"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Edit cashout
                                                        </span>
                                                    </Button>
                                                )}
                                            {(transaction.type === 'BUY_IN' ||
                                                transaction.type ===
                                                    'ADJUSTMENT') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleUndo(
                                                            transaction.id
                                                        )
                                                    }
                                                    disabled={isPending}
                                                    className="h-10 w-10 rounded-xl"
                                                >
                                                    <Undo2 className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Undo transaction
                                                    </span>
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
