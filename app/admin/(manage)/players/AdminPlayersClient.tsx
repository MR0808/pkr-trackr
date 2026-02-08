'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import {
    adminCreatePlayerAction,
    adminUpdatePlayerAction
} from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';

type PlayerRow = { id: string; name: string; gameCount: number };

export function AdminPlayersClient({ initialPlayers }: { initialPlayers: PlayerRow[] }) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await adminCreatePlayerAction(newName.trim());
        setLoading(false);
        if (res.success) {
            setCreateOpen(false);
            setNewName('');
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
        const res = await adminUpdatePlayerAction(editId, editName.trim());
        setLoading(false);
        if (res.success) {
            setEditId(null);
            setEditName('');
            router.refresh();
        } else {
            setError(res.error ?? 'Failed');
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All players</CardTitle>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add player
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add player</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newName">Name</Label>
                                <Input
                                    id="newName"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Player name"
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Adding…' : 'Add'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {initialPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No players yet. Add one above.</p>
                ) : (
                    <ul className="space-y-2">
                        {initialPlayers.map((p) => (
                            <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                            >
                                <span className="font-medium">{p.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {p.gameCount} game{p.gameCount !== 1 ? 's' : ''}
                                    </span>
                                    {editId === p.id ? (
                                        <form onSubmit={handleUpdate} className="flex gap-2">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8 w-40"
                                                autoFocus
                                            />
                                            <Button type="submit" size="sm" disabled={loading}>
                                                Save
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditId(null);
                                                    setEditName('');
                                                    setError(null);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </form>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => {
                                                setEditId(p.id);
                                                setEditName(p.name);
                                                setError(null);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Edit
                                        </Button>
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
