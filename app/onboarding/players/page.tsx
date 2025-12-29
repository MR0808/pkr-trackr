'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPlayer } from '@/src/server/actions/playerActions';
import { inviteMember } from '@/src/server/actions/leagueActions';
import { getLeagues } from '@/src/server/actions/leagueActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';

export default function OnboardingPlayersPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [players, setPlayers] = useState<Array<{ id: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leagueId, setLeagueId] = useState('');

  useEffect(() => {
    // Get the user's first league
    getLeagues()
      .then((leagues) => {
        if (leagues.length > 0) {
          setLeagueId(leagues[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to get leagues:', err);
      });
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setError('');
    setLoading(true);

    try {
      const player = await createPlayer({ name: playerName });
      setPlayers([...players, { id: player.id, displayName: player.displayName }]);
      setPlayerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !leagueId) return;

    setError('');
    setLoading(true);

    try {
      await inviteMember({ leagueId, email: inviteEmail });
      setInviteEmail('');
      // Show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/onboarding/first-night');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="flex justify-center mb-6">
          <Logo variant="icon" size="md" />
        </div>
        <h1 className="text-2xl font-semibold mb-2 text-center">Add Players</h1>
        <p className="text-sm text-brand-muted mb-6 text-center">
          Players don't need accounts. Invites are optional.
        </p>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <form onSubmit={handleAddPlayer} className="flex gap-2">
            <Input
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 flex-1"
            />
            <Button type="submit" disabled={loading || !playerName.trim()}>
              Add
            </Button>
          </form>

          {players.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Added Players:</p>
              <div className="space-y-1">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="p-2 bg-zinc-800 rounded text-sm flex justify-between items-center"
                  >
                    <span>{player.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leagueId && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Invite by email (optional)"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={loading}
                className="bg-zinc-800 border-zinc-700 flex-1"
              />
              <Button type="submit" variant="outline" disabled={loading || !inviteEmail.trim()}>
                Invite
              </Button>
            </form>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={handleContinue} className="flex-1" disabled={loading}>
            Continue to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/onboarding/first-night')}
            variant="outline"
            disabled={loading}
          >
            Create First Night
          </Button>
        </div>
      </Card>
    </div>
  );
}

