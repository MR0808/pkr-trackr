'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminGamePlayerRow } from '@/actions/admin';
import { adminUpdateGamePlayerAmounts } from '@/actions/admin';

type GameInfo = { id: string; name: string; status: string };

function centsToDollars(c: number): string {
    if (c === 0) return '0';
    return (c / 100).toFixed(2);
}
function dollarsToCents(s: string): number {
    const n = parseFloat(s);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
}

export function AdminGameEditForm({
    gameId,
    game,
    initialPlayers
}: {
    gameId: string;
    game: GameInfo;
    initialPlayers: AdminGamePlayerRow[];
}) {
    const router = useRouter();
    const [players, setPlayers] = useState(() =>
        initialPlayers.map((p) => ({
            ...p,
            buyInDollars: centsToDollars(p.buyInCents),
            cashOutDollars: p.cashOutCents != null ? centsToDollars(p.cashOutCents) : '',
            adjustmentDollars: p.adjustmentCents === 0 ? '0' : (p.adjustmentCents / 100).toFixed(2)
        }))
    );
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function setBuyIn(index: number, value: string) {
        setPlayers((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], buyInDollars: value };
            return next;
        });
    }
    function setCashOut(index: number, value: string) {
        setPlayers((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], cashOutDollars: value };
            return next;
        });
    }
    function setAdjustment(index: number, value: string) {
        setPlayers((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], adjustmentDollars: value };
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const updates = players.map((p) => ({
            gamePlayerId: p.gamePlayerId,
            buyInCents: dollarsToCents(p.buyInDollars),
            cashOutCents: p.cashOutDollars.trim() === '' ? null : dollarsToCents(p.cashOutDollars),
            adjustmentCents: dollarsToCents(p.adjustmentDollars)
        }));
        const res = await adminUpdateGamePlayerAmounts(gameId, updates);
        setLoading(false);
        if (res.success) {
            router.refresh();
            router.push('/admin/games');
        } else {
            setError(res.error ?? 'Failed to save');
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Per-player amounts</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Edit buy-in, cash-out, and adjustment in dollars. Leave cash-out empty if not set.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2 pr-4 text-left font-medium">Player</th>
                                    <th className="pb-2 pr-4 text-right font-medium">Buy-in ($)</th>
                                    <th className="pb-2 pr-4 text-right font-medium">Cash-out ($)</th>
                                    <th className="pb-2 text-right font-medium">Adjustment ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((p, i) => (
                                    <tr key={p.gamePlayerId} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium">{p.playerName}</td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="h-8 w-24 text-right"
                                                value={p.buyInDollars}
                                                onChange={(e) => setBuyIn(i, e.target.value)}
                                            />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="h-8 w-24 text-right"
                                                placeholder="—"
                                                value={p.cashOutDollars}
                                                onChange={(e) => setCashOut(i, e.target.value)}
                                            />
                                        </td>
                                        <td className="py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-8 w-24 text-right"
                                                placeholder="0"
                                                value={p.adjustmentDollars}
                                                onChange={(e) => setAdjustment(i, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {players.length === 0 && (
                        <p className="text-sm text-muted-foreground">No players in this game yet.</p>
                    )}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={loading || players.length === 0}>
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.push('/admin/games')}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
