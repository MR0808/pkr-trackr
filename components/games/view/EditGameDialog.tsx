'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { updateGameAction } from '@/actions/games';
import { toast } from 'sonner';

type SeasonOption = { id: string; name: string };

export function EditGameDialog({
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
    const [open, setOpen] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editDate, setEditDate] = useState(
        format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm")
    );
    const [editSeasonId, setEditSeasonId] = useState(seasonId ?? '');
    const [loading, setLoading] = useState(false);

    function resetForm() {
        setEditName(name);
        setEditDate(format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm"));
        setEditSeasonId(seasonId ?? '');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await updateGameAction({
            gameId,
            name: editName.trim(),
            scheduledAt: new Date(editDate),
            seasonId: editSeasonId || null
        });
        setLoading(false);
        if (res.success) {
            toast.success('Night updated');
            setOpen(false);
            router.refresh();
        } else {
            toast.error(res.error ?? 'Failed to update night');
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit night
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit night</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="gameName">Name</Label>
                        <Input
                            id="gameName"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gameDate">Date & time</Label>
                        <Input
                            id="gameDate"
                            type="datetime-local"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gameSeason">Season</Label>
                        <select
                            id="gameSeason"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editSeasonId}
                            onChange={(e) => setEditSeasonId(e.target.value)}
                        >
                            <option value="">None</option>
                            {seasonOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
