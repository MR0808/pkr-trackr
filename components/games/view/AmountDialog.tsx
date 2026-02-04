'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Delete } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, parseCurrencyInput } from '@/lib/money';
import {
    addBuyInAction,
    setCashoutAction,
    addAdjustmentAction
} from '@/actions/games';
import type { Player } from '@/types/players';
import { toast } from 'sonner';

interface AmountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    player: Player;
    gameId: string;
    mode: 'buy-in' | 'cashout' | 'adjustment';
    // Optional optimistic callbacks for better UX when using controlled Player cards
    onOptimisticAdd?: (amount: number) => void;
    // Revert callback may be provided as a zero-arg or single-arg function depending on
    // the parent (some parents just trigger a revert by playerId), so accept an
    // optional amount parameter for flexibility.
    onOptimisticRevert?: (amount?: number) => void;
    onSuccess?: () => void;
}

const PRESET_AMOUNTS = [10, 20, 50, 100];
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00'];

export function AmountDialog({
    open,
    onOpenChange,
    player,
    gameId,
    mode,
    onOptimisticAdd,
    onOptimisticRevert,
    onSuccess
}: AmountDialogProps) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isPending, startTransition] = useTransition();

    const numericAmount = parseCurrencyInput(amount);
    const isAdjustment = mode === 'adjustment';
    const isNegativeAdjustment = isAdjustment && amount.startsWith('-');

    const handleDigitClick = (digit: string) => {
        if (amount === '0' && digit !== '00') {
            setAmount(digit);
        } else {
            setAmount(amount + digit);
        }
    };

    const handleClear = () => {
        setAmount('');
    };

    const handleBackspace = () => {
        setAmount(amount.slice(0, -1));
    };

    const handlePreset = (presetAmount: number) => {
        setAmount(String(presetAmount));
    };

    const handleToggleSign = () => {
        if (!isAdjustment) return;
        if (amount.startsWith('-')) {
            setAmount(amount.slice(1));
        } else if (amount) {
            setAmount('-' + amount);
        }
    };

    const optimisticAppliedRef = useRef(false);
    const completedRef = useRef(false);

    useEffect(() => {
        // if dialog is closed while an optimistic update is applied but not completed,
        // call the revert callback so the UI doesn't stay out of sync
        if (!open && optimisticAppliedRef.current && !completedRef.current) {
            onOptimisticRevert?.(numericAmount);
            optimisticAppliedRef.current = false;
        }
    }, [open, numericAmount, onOptimisticRevert]);

    const handleSubmit = () => {
        if (!numericAmount && mode !== 'adjustment') return;
        if (mode === 'adjustment' && numericAmount === 0) return;

        // Apply optimistic callback for buy-ins to update the PlayerCard immediately
        if (mode === 'buy-in') {
            onOptimisticAdd?.(numericAmount);
            optimisticAppliedRef.current = true;
            completedRef.current = false;
        }

        startTransition(async () => {
            let result;

            if (mode === 'buy-in') {
                result = await addBuyInAction({
                    gameId,
                    playerId: player.id,
                    amount: numericAmount
                });
            } else if (mode === 'cashout') {
                result = await setCashoutAction({
                    gameId,
                    playerId: player.id,
                    amount: numericAmount
                });
            } else {
                const adjustmentAmount = isNegativeAdjustment
                    ? -numericAmount
                    : numericAmount;
                result = await addAdjustmentAction({
                    gameId,
                    playerId: player.id,
                    amount: adjustmentAmount,
                    note: note || undefined
                });
            }

            if (result.success) {
                completedRef.current = true;
                // notify parent to refresh / clear optimistic state if needed
                onSuccess?.();

                toast(
                    mode === 'buy-in'
                        ? 'Buy-in added'
                        : mode === 'cashout'
                          ? 'Cashout set'
                          : 'Adjustment added',
                    {
                        description: `${formatCurrency(
                            Math.abs(
                                mode === 'adjustment' && isNegativeAdjustment
                                    ? -numericAmount
                                    : numericAmount
                            )
                        )} for ${player.name}`
                    }
                );
                setAmount('');
                setNote('');
                onOpenChange(false);
            } else {
                // revert optimistic update if it was applied
                if (mode === 'buy-in' && optimisticAppliedRef.current) {
                    onOptimisticRevert?.(numericAmount);
                    optimisticAppliedRef.current = false;
                }

                toast.error('Error', {
                    description: result.error || 'Failed to process transaction'
                });
            }
        });
    };

    const displayAmount = numericAmount
        ? formatCurrency(isNegativeAdjustment ? -numericAmount : numericAmount)
        : '$0';

    const title =
        mode === 'buy-in'
            ? 'Custom Buy-in'
            : mode === 'cashout'
              ? 'Set Cashout'
              : 'Adjustment';

    const description =
        mode === 'buy-in'
            ? `Add a custom buy-in for ${player.name}`
            : mode === 'cashout'
              ? `Set the cashout amount for ${player.name}`
              : `Add an adjustment for ${player.name}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl lg:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Display */}
                    <div className="flex items-center justify-center rounded-xl bg-muted p-4">
                        <div className="tabular-nums text-3xl font-bold lg:text-4xl">
                            {displayAmount}
                        </div>
                    </div>

                    {/* Preset buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_AMOUNTS.map((preset) => (
                            <Button
                                key={preset}
                                type="button"
                                variant="secondary"
                                onClick={() => handlePreset(preset)}
                                disabled={isPending}
                                className="h-12 rounded-xl text-base lg:h-14 lg:text-lg"
                            >
                                ${preset}
                            </Button>
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2">
                        {KEYPAD_DIGITS.map((digit) => (
                            <Button
                                key={digit}
                                type="button"
                                variant="outline"
                                onClick={() => handleDigitClick(digit)}
                                disabled={isPending}
                                className="h-14 rounded-2xl text-xl lg:h-16"
                            >
                                {digit}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackspace}
                            disabled={isPending || !amount}
                            className="h-14 rounded-2xl lg:h-16 bg-transparent"
                        >
                            <Delete className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Toggle sign for adjustments */}
                    {isAdjustment && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleToggleSign}
                            disabled={isPending || !amount}
                            className="w-full bg-transparent"
                        >
                            {isNegativeAdjustment
                                ? 'Switch to Positive'
                                : 'Switch to Negative'}
                        </Button>
                    )}

                    {/* Note for adjustments */}
                    {isAdjustment && (
                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note for this adjustment"
                                disabled={isPending}
                                rows={2}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClear}
                            disabled={isPending || !amount}
                            className="flex-1 bg-transparent"
                        >
                            Clear
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending || numericAmount === 0}
                            className="flex-1"
                        >
                            {isPending ? 'Processing...' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
