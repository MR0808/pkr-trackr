'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditGameDialog } from '@/components/games/view/EditGameDialog';
import {
    reopenGameAction,
    reprocessGameAction
} from '@/actions/games';
import { toast } from 'sonner';

type SeasonOption = { id: string; name: string };

export function ManageClosedNight({
    gameId,
    name,
    scheduledAt,
    seasonId,
    seasonOptions
}: {
    gameId: string;
    name: string;
    scheduledAt: Date;
    seasonId: string | null;
    seasonOptions: SeasonOption[];
}) {
    const router = useRouter();
    const [reopenLoading, setReopenLoading] = useState(false);
    const [reprocessLoading, setReprocessLoading] = useState(false);

    async function handleReopen() {
        setReopenLoading(true);
        const res = await reopenGameAction({ gameId });
        setReopenLoading(false);
        if (res.success) {
            toast.success('Night reopened for editing');
            router.push(`/games/${gameId}`);
        } else {
            toast.error(res.error ?? 'Failed to reopen night');
        }
    }

    async function handleReprocess() {
        setReprocessLoading(true);
        const res = await reprocessGameAction({ gameId });
        setReprocessLoading(false);
        if (res.success) {
            toast.success('Season stats recalculated');
            router.refresh();
        } else {
            toast.error(res.error ?? 'Failed to reprocess night');
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <EditGameDialog
                gameId={gameId}
                name={name}
                scheduledAt={scheduledAt}
                seasonId={seasonId}
                seasonOptions={seasonOptions}
            />
            <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleReopen}
                disabled={reopenLoading}
            >
                <Unlock className="h-3.5 w-3.5" />
                {reopenLoading ? 'Reopening…' : 'Reopen for editing'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href={`/admin/games/${gameId}/edit`}>Edit amounts</Link>
            </Button>
            {seasonId && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    onClick={handleReprocess}
                    disabled={reprocessLoading}
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {reprocessLoading ? 'Reprocessing…' : 'Reprocess season stats'}
                </Button>
            )}
        </div>
    );
}
