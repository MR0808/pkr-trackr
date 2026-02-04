'use client';

import { useTransition, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { addPlayersAction } from '@/actions/games';
import { useGameStore } from '@/components/games/stores/useGameStore';
import { toast } from 'sonner';

interface AddPlayerDialogProps {
    gameId: string;
    isGameClosed: boolean;
    // Optional callback to let parent show optimistic players immediately
    onOptimisticAdd?: (players: Array<{ id: string; name: string }>) => void;
    onOptimisticRevert?: (playerIds: string[]) => void;
}

export function AddPlayerDialog({
    gameId,
    isGameClosed,
    onOptimisticAdd,
    onOptimisticRevert
}: AddPlayerDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [availablePlayers, setAvailablePlayers] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [newPlayerText, setNewPlayerText] = useState(''); // newline/comma-separated names

    const prevAvailableRef = useRef<typeof availablePlayers | null>(null);

    useEffect(() => {
        if (!open) return;
        startTransition(async () => {
            try {
                const list = await useGameStore
                    .getState()
                    .getAvailablePlayers(gameId);
                setAvailablePlayers(list);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load players');
            }
        });
    }, [open, gameId]);

    const toggleSelect = (id: string) => {
        setSelectedPlayerIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const onSubmit = () => {
        // Optimistically remove selected players from the available list so the UI
        // reflects the 'adding' action immediately.
        prevAvailableRef.current = availablePlayers;
        setAvailablePlayers((prev) =>
            prev.filter((p) => !selectedPlayerIds.includes(p.id))
        );

        // Build optimistic player entries (existing selections + new names)
        const newNames = newPlayerText
            .split(/\r?\n|,/) // split by newline or comma
            .map((s) => s.trim())
            .filter(Boolean);

        const selectedPlayers = availablePlayers.filter((p) =>
            selectedPlayerIds.includes(p.id)
        );

        // Create optimistic player objects (existing selected players plus temporary new ones)
        const tempNewPlayers = newNames.map((name, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            name,
            // default numeric fields so formatting shows $0 immediately and avoids NaN
            buyInsTotal: 0,
            cashout: null,
            adjustmentsTotal: 0,
            net: 0
        }));

        const selectedPlayersOptimistic = selectedPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            buyInsTotal: 0,
            cashout: null,
            adjustmentsTotal: 0,
            net: 0
        }));

        const optimisticPlayers = [
            ...selectedPlayersOptimistic,
            ...tempNewPlayers
        ];

        // Ask parent to show optimistic players immediately (if provided)
        onOptimisticAdd?.(optimisticPlayers);

        // Clear UI selections and close immediately for snappy UX
        const selectedCopy = [...selectedPlayerIds];
        setSelectedPlayerIds([]);
        setNewPlayerText('');
        setOpen(false);

        startTransition(async () => {
            const result = await addPlayersAction({
                gameId,
                playerIds: selectedCopy,
                newPlayerNames: newNames
            });

            if (!result.success) {
                // revert optimistic available list
                if (prevAvailableRef.current) {
                    setAvailablePlayers(prevAvailableRef.current);
                }
                // revert optimistic players in parent
                onOptimisticRevert?.(optimisticPlayers.map((p) => p.id));

                toast.error('Failed to add players', {
                    description: result.error || undefined
                });
                return;
            }

            // Clear optimistic players so we don't show duplicates after refresh.
            // Refresh will replace with server data (real ids).
            onOptimisticRevert?.(optimisticPlayers.map((p) => p.id));

            const parts: string[] = [];
            if (result.addedPlayerIds && result.addedPlayerIds.length > 0)
                parts.push(`${result.addedPlayerIds.length} added`);
            if (result.alreadyInGame && result.alreadyInGame.length > 0)
                parts.push(`${result.alreadyInGame.length} already in game`);
            if (result.createdPlayerIds && result.createdPlayerIds.length > 0)
                parts.push(`${result.createdPlayerIds.length} created`);
            if (result.invalidPlayerIds && result.invalidPlayerIds.length > 0)
                parts.push(`${result.invalidPlayerIds.length} invalid`);

            toast('Players updated', {
                description: parts.join(' • ') || 'No changes'
            });

            // invalidate the available players cache so next open fetches fresh data
            useGameStore.getState().invalidateAvailablePlayers(gameId);

            // refresh server data so the game UIs update
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    disabled={isGameClosed}
                    className="h-full min-h-35 w-full flex-col gap-2 rounded-2xl border-dashed bg-transparent cursor-pointer"
                >
                    <Plus className="h-8 w-8" />
                    <span className="text-base lg:text-lg">Add Players</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Players</DialogTitle>
                    <DialogDescription>
                        Select existing players to add, or type new player names
                        (one per line or comma-separated).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Existing Players</Label>
                        <div className="mt-2 max-h-64 overflow-auto rounded-md border p-2">
                            {availablePlayers.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No available players
                                </div>
                            ) : (
                                availablePlayers.map((p) => (
                                    <label
                                        key={p.id}
                                        className="flex items-center gap-2 py-1"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPlayerIds.includes(
                                                p.id
                                            )}
                                            onChange={() => toggleSelect(p.id)}
                                            disabled={isPending}
                                        />
                                        <span className="ml-2">{p.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <Label>New Players</Label>
                        <textarea
                            value={newPlayerText}
                            onChange={(e) => setNewPlayerText(e.target.value)}
                            placeholder="Enter new player names, one per line or comma-separated"
                            className="mt-2 w-full rounded-md border p-2 text-sm"
                            rows={4}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => onSubmit()}
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? 'Adding...' : 'Add Players'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
