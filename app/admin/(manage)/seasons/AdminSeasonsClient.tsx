'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import {
    adminCreateSeasonAction,
    adminLockSeasonAction,
    adminUnlockSeasonAction
} from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, Plus } from 'lucide-react';

type SeasonRow = {
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date | null;
    isLocked: boolean;
    gameCount: number;
};

export function AdminSeasonsClient({ initialSeasons }: { initialSeasons: SeasonRow[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [startsAt, setStartsAt] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endsAt, setEndsAt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await adminCreateSeasonAction({ name: name.trim(), startsAt, endsAt: endsAt || undefined });
        setLoading(false);
        if (res.success) {
            setOpen(false);
            setName('');
            setStartsAt(format(new Date(), 'yyyy-MM-dd'));
            setEndsAt('');
            router.refresh();
        } else {
            setError(res.error ?? 'Failed');
        }
    }

    async function handleLock(seasonId: string) {
        const res = await adminLockSeasonAction(seasonId);
        if (res.success) router.refresh();
    }
    async function handleUnlock(seasonId: string) {
        const res = await adminUnlockSeasonAction(seasonId);
        if (res.success) router.refresh();
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All seasons</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New season
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create season</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. 2025"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startsAt">Start date</Label>
                                    <Input
                                        id="startsAt"
                                        type="date"
                                        value={startsAt}
                                        onChange={(e) => setStartsAt(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endsAt">End date (optional)</Label>
                                    <Input
                                        id="endsAt"
                                        type="date"
                                        value={endsAt}
                                        onChange={(e) => setEndsAt(e.target.value)}
                                    />
                                </div>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating…' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {initialSeasons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No seasons yet. Create one above.</p>
                ) : (
                    <ul className="space-y-2">
                        {initialSeasons.map((s) => (
                            <li
                                key={s.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{s.name}</span>
                                    <Badge variant={s.isLocked ? 'secondary' : 'outline'}>
                                        {s.isLocked ? 'Locked' : 'Open'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(s.startsAt), 'MMM d, yyyy')}
                                        {s.endsAt ? ` – ${format(new Date(s.endsAt), 'MMM d, yyyy')}` : ''}
                                        {' · '}{s.gameCount} game{s.gameCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {s.isLocked ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => handleUnlock(s.id)}
                                        >
                                            <Unlock className="h-3 w-3" />
                                            Unlock
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => handleLock(s.id)}
                                        >
                                            <Lock className="h-3 w-3" />
                                            Lock
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
