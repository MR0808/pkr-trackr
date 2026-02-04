'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { closeGameAction } from '@/actions/games';
import { toast } from 'sonner';
import type { GameTotals } from '@/types/games';
import { TotalsBar } from '@/components/games/view/TotalsBar';

interface CloseGameDialogProps {
    gameId: string;
    totals: GameTotals;
    isGameClosed: boolean;
}

export function CloseGameDialog({
    gameId,
    totals,
    isGameClosed
}: CloseGameDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [confirmText, setConfirmText] = useState('');
    const router = useRouter();

    const handleOpenChange = (value: boolean) => {
        setOpen(value);
        if (!value) setConfirmText('');
    };

    const isConfirmed = confirmText.trim().toLowerCase() === 'close';

    const handleClose = () => {
        startTransition(async () => {
            const result = await closeGameAction({ gameId });

            if (result.success) {
                toast('Game closed', {
                    description:
                        'The game has been closed and results are ready to share'
                });
                setOpen(false);
                router.push(`/games/${gameId}/results`);
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to close game'
                });
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    disabled={isGameClosed}
                    className="h-12 lg:h-14"
                >
                    Close Game
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle>Close this game?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will finalize the game and generate a shareable
                        results page. You will not be able to make any more
                        changes.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <TotalsBar totals={totals} />

                    {totals.bankDelta !== 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Warning: The bank is not balanced. Total in and
                                total out do not match. There is a{' '}
                                {totals.bankDelta > 0 ? 'surplus' : 'deficit'}{' '}
                                of{' '}
                                <span className="font-semibold">
                                    ${Math.abs(totals.bankDelta)}
                                </span>
                                .
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor={`confirm-close-${gameId}`}
                            className="text-sm font-medium"
                        >
                            Type{' '}
                            <span className="font-mono font-semibold">
                                CLOSE
                            </span>{' '}
                            to confirm
                        </Label>
                        <Input
                            id={`confirm-close-${gameId}`}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="CLOSE"
                            disabled={isPending}
                            className="font-mono"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleClose}
                        disabled={isPending || !isConfirmed}
                        title={
                            !isConfirmed ? 'Type CLOSE to confirm' : undefined
                        }
                    >
                        {isPending ? 'Closing...' : 'Close & Generate Results'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
