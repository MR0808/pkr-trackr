'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    adminCreateGameAction,
    adminUpdateGameAction
} from '@/actions/admin';
import { closeGameAction } from '@/actions/games';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, ExternalLink, DollarSign } from 'lucide-react';

type GameRow = {
    id: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    scheduledAt: Date;
    closedAt: Date | null;
    seasonId: string | null;
    seasonName: string | null;
    playerCount: number;
};

type SeasonOption = { id: string; name: string };

export function AdminGamesClient({
    initialGames,
    seasonOptions
}: {
    initialGames: GameRow[];
    seasonOptions: SeasonOption[];
}) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [newSeasonId, setNewSeasonId] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editSeasonId, setEditSeasonId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await adminCreateGameAction({
            name: newName.trim(),
            scheduledAt: new Date(newDate).toISOString(),
            seasonId: newSeasonId || undefined
        });
        setLoading(false);
        if (res.success && res.gameId) {
            setCreateOpen(false);
            setNewName('');
            setNewDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
            setNewSeasonId('');
            router.push(`/games/${res.gameId}`);
            router.refresh();
        } else {
            setError(res.error ?? 'Failed');
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editId) return;
        setError(null);
        setLoading(true);
        const res = await adminUpdateGameAction({
            gameId: editId,
            name: editName.trim(),
            scheduledAt: editDate ? new Date(editDate).toISOString() : undefined,
            seasonId: editSeasonId || null
        });
        setLoading(false);
        if (res.success) {
            setEditId(null);
            router.refresh();
        } else {
            setError(res.error ?? 'Failed');
        }
    }

    async function handleClose(gameId: string) {
        const res = await closeGameAction({ gameId });
        if (res.success) router.refresh();
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Games</CardTitle>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New game
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create game</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newName">Name</Label>
                                <Input
                                    id="newName"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Friday night"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newDate">Date & time</Label>
                                <Input
                                    id="newDate"
                                    type="datetime-local"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newSeasonId">Season (optional)</Label>
                                <select
                                    id="newSeasonId"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newSeasonId}
                                    onChange={(e) => setNewSeasonId(e.target.value)}
                                >
                                    <option value="">None</option>
                                    {seasonOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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
                {initialGames.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No games yet. Create one above.</p>
                ) : (
                    <ul className="space-y-2">
                        {initialGames.map((g) => (
                            <li
                                key={g.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/games/${g.id}`}
                                        className="font-medium hover:underline flex items-center gap-1"
                                    >
                                        {g.name}
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <Badge variant={g.status === 'CLOSED' ? 'secondary' : 'default'}>
                                        {g.status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(g.scheduledAt), 'MMM d, yyyy HH:mm')}
                                        {g.seasonName ? ` · ${g.seasonName}` : ''}
                                        {' · '}{g.playerCount} player{g.playerCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                                        <Link href={`/admin/games/${g.id}/edit`}>
                                            <DollarSign className="h-3 w-3" />
                                            Edit buy-ins
                                        </Link>
                                    </Button>
                                    {g.status === 'OPEN' && (
                                        <>
                                            {editId === g.id ? (
                                                <form onSubmit={handleUpdate} className="flex flex-wrap items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-36"
                                                        placeholder="Name"
                                                    />
                                                    <Input
                                                        type="datetime-local"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className="h-8 w-44"
                                                    />
                                                    <select
                                                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                                        value={editSeasonId}
                                                        onChange={(e) => setEditSeasonId(e.target.value)}
                                                    >
                                                        <option value="">No season</option>
                                                        {seasonOptions.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button type="submit" size="sm" disabled={loading}>
                                                        Save
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditId(null);
                                                            setError(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </form>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => {
                                                            setEditId(g.id);
                                                            setEditName(g.name);
                                                            setEditDate(format(new Date(g.scheduledAt), "yyyy-MM-dd'T'HH:mm"));
                                                            setEditSeasonId(g.seasonId ?? '');
                                                            setError(null);
                                                        }}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleClose(g.id)}
                                                    >
                                                        Close game
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {error && editId && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </CardContent>
        </Card>
    );
}
