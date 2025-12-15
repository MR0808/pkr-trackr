'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createNight } from '@/src/server/actions/nightActions';
import { finalizeNight } from '@/src/server/actions/nightActions';
import { formatCents } from '@/src/server/metrics/pokerMetrics';
import { calculateNightPot } from '@/src/server/metrics/pokerMetrics';
import Link from 'next/link';
import { Plus, CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NightsTabProps {
  leagueId: string;
  seasons: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  activeSeason: {
    id: string;
    name: string;
  } | null;
  nights: Array<{
    id: string;
    date: Date;
    status: string;
    notes: string | null;
    entries: Array<{
      id: string;
      buyInTotalCents: number;
      cashOutTotalCents: number;
      player: {
        id: string;
        name: string;
      };
    }>;
  }>;
}

export function NightsTab({ leagueId, seasons, activeSeason, nights }: NightsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!activeSeason) {
    return (
      <Card className="p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          No active season. Create a season first.
        </p>
      </Card>
    );
  }

  const handleCreateNight = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createNight({
        seasonId: activeSeason.id,
        date: new Date(date),
        notes: notes || undefined,
      });
      setShowCreateForm(false);
      setDate('');
      setNotes('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create night');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (nightId: string) => {
    if (!confirm('Are you sure you want to finalize this night? This cannot be undone.')) {
      return;
    }

    try {
      await finalizeNight({ nightId });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to finalize night');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Nights - {activeSeason.name}</h2>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Night
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Night</h3>
          <form onSubmit={handleCreateNight} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Night'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {nights.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            No nights yet. Create your first night to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {nights.map((night) => {
            const nightPot = calculateNightPot(night.entries);
            const totalBuyIn = night.entries.reduce(
              (sum, e) => sum + e.buyInTotalCents,
              0
            );
            const totalCashOut = night.entries.reduce(
              (sum, e) => sum + e.cashOutTotalCents,
              0
            );
            const canFinalize = totalBuyIn === totalCashOut && night.entries.length > 0;

            return (
              <Card key={night.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">
                        {new Date(night.date).toLocaleDateString()}
                      </h3>
                      <Badge variant={night.status === 'FINAL' ? 'default' : 'secondary'}>
                        {night.status}
                      </Badge>
                    </div>
                    {night.notes && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {night.notes}
                      </p>
                    )}
                  </div>
                  {night.status === 'DRAFT' && canFinalize && (
                    <Button
                      size="sm"
                      onClick={() => handleFinalize(night.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalize
                    </Button>
                  )}
                </div>

                <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Pot:</span>{' '}
                    <span className="font-semibold">${formatCents(nightPot)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Buy-ins:</span>{' '}
                    <span className="font-semibold">${formatCents(totalBuyIn)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Cash-outs:</span>{' '}
                    <span className="font-semibold">${formatCents(totalCashOut)}</span>
                  </div>
                </div>

                {!canFinalize && night.status === 'DRAFT' && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-700 dark:text-yellow-400 text-sm">
                    Cannot finalize: Buy-ins (${formatCents(totalBuyIn)}) do not equal
                    cash-outs (${formatCents(totalCashOut)})
                  </div>
                )}

                <Link href={`/leagues/${leagueId}/nights/${night.id}`}>
                  <Button variant="outline" className="w-full">
                    View/Edit Entries ({night.entries.length})
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

