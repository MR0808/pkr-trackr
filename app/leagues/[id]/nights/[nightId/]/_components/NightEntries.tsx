'use client';

import { useState } from 'react';
import { createEntry, updateEntry, deleteEntry } from '@/src/server/actions/entryActions';
import { createPlayer } from '@/src/server/actions/playerActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCents, calculateEntryMetrics, calculateNightPot } from '@/src/lib/format';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NightEntriesProps {
  leagueId: string;
  night: {
    id: string;
    date: Date;
    status: string;
    notes: string | null;
    entries: Array<{
      id: string;
      playerId: string;
      buyInTotalCents: number;
      cashOutTotalCents: number;
      player: {
        id: string;
        name: string;
      };
    }>;
  };
  players: Array<{
    id: string;
    name: string;
    userId: string | null;
  }>;
}

export function NightEntries({ leagueId, night, players }: NightEntriesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFinal = night.status === 'FINAL';
  const nightPot = calculateNightPot(night.entries);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let playerId = selectedPlayerId;

      // Create new player if needed
      if (newPlayerName && !playerId) {
        const newPlayer = await createPlayer({ name: newPlayerName });
        playerId = newPlayer.id;
      }

      if (!playerId) {
        throw new Error('Please select or create a player');
      }

      await createEntry({
        nightId: night.id,
        playerId,
        buyInTotalCents: Math.round(parseFloat(buyIn) * 100),
        cashOutTotalCents: Math.round(parseFloat(cashOut) * 100),
      });

      setShowAddForm(false);
      setNewPlayerName('');
      setSelectedPlayerId('');
      setBuyIn('');
      setCashOut('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (entryId: string) => {
    setError('');
    setLoading(true);

    try {
      await updateEntry({
        entryId,
        buyInTotalCents: Math.round(parseFloat(buyIn) * 100),
        cashOutTotalCents: Math.round(parseFloat(cashOut) * 100),
      });

      setEditingId(null);
      setBuyIn('');
      setCashOut('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await deleteEntry({ entryId });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const startEdit = (entry: typeof night.entries[0]) => {
    setEditingId(entry.id);
    setBuyIn((entry.buyInTotalCents / 100).toFixed(2));
    setCashOut((entry.cashOutTotalCents / 100).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBuyIn('');
    setCashOut('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Entries</h2>
          <Badge variant={isFinal ? 'default' : 'secondary'} className="mt-2">
            {night.status}
          </Badge>
        </div>
        {!isFinal && !showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add Entry</h3>
          <form onSubmit={handleAddEntry} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Player or Create New
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => {
                  setSelectedPlayerId(e.target.value);
                  setNewPlayerName('');
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 mb-2"
              >
                <option value="">-- Select Player --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">OR</span>
              <Input
                placeholder="New player name"
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.target.value);
                  setSelectedPlayerId('');
                }}
                disabled={loading || !!selectedPlayerId}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Buy-in ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={buyIn}
                  onChange={(e) => setBuyIn(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cash-out ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashOut}
                  onChange={(e) => setCashOut(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Entry'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Buy-in</TableHead>
              <TableHead>Cash-out</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>ROI</TableHead>
              {!isFinal && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {night.entries.map((entry) => {
              const metrics = calculateEntryMetrics(
                entry.buyInTotalCents,
                entry.cashOutTotalCents,
                nightPot
              );

              if (editingId === entry.id) {
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.player.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={buyIn}
                        onChange={(e) => setBuyIn(e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashOut}
                        onChange={(e) => setCashOut(e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell colSpan={isFinal ? 2 : 3}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateEntry(entry.id)}
                          disabled={loading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.player.name}</TableCell>
                  <TableCell>${formatCents(entry.buyInTotalCents)}</TableCell>
                  <TableCell>${formatCents(entry.cashOutTotalCents)}</TableCell>
                  <TableCell
                    className={
                      metrics.profit >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    ${formatCents(metrics.profit)}
                  </TableCell>
                  <TableCell>{formatPercentage(metrics.roi)}</TableCell>
                  {!isFinal && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(entry)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {night.entries.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Total Pot:</span>
              <div className="font-bold text-lg">${formatCents(nightPot)}</div>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Total Buy-ins:</span>
              <div className="font-bold">
                ${formatCents(night.entries.reduce((s, e) => s + e.buyInTotalCents, 0))}
              </div>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Total Cash-outs:</span>
              <div className="font-bold">
                ${formatCents(night.entries.reduce((s, e) => s + e.cashOutTotalCents, 0))}
              </div>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Balance:</span>
              <div
                className={`font-bold ${
                  night.entries.reduce((s, e) => s + e.buyInTotalCents - e.cashOutTotalCents, 0) ===
                  0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                ${formatCents(
                  night.entries.reduce(
                    (s, e) => s + e.buyInTotalCents - e.cashOutTotalCents,
                    0
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

