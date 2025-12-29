'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeague } from '@/src/server/actions/leagueActions';
import { createSeason } from '@/src/server/actions/seasonActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';

export default function OnboardingLeaguePage() {
  const router = useRouter();
  const [leagueName, setLeagueName] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [defaultBuyIn, setDefaultBuyIn] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create league
      const league = await createLeague({
        name: leagueName,
        description: `Default buy-in: ${currency} ${defaultBuyIn}`,
      });

      // Create default season
      await createSeason({
        leagueId: league.id,
        name: new Date().getFullYear().toString(),
        startDate: new Date(new Date().getFullYear(), 0, 1),
      });

      router.push('/onboarding/players');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="flex justify-center mb-6">
          <Logo variant="icon" size="md" />
        </div>
        <h1 className="text-2xl font-semibold mb-6 text-center">Create Your League</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="leagueName" className="block text-sm font-medium mb-1">
              League Name *
            </label>
            <Input
              id="leagueName"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              required
              disabled={loading}
              maxLength={100}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white"
            >
              <option value="AUD">AUD ($)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white"
            >
              <option value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</option>
              <option value="Australia/Melbourne">Australia/Melbourne (AEDT/AEST)</option>
              <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
              <option value="Australia/Perth">Australia/Perth (AWST)</option>
              <option value="Australia/Adelaide">Australia/Adelaide (ACDT/ACST)</option>
              <option value="Australia/Darwin">Australia/Darwin (ACST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Chicago">America/Chicago (CST/CDT)</option>
              <option value="America/Denver">America/Denver (MST/MDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
              <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Pacific/Auckland">Pacific/Auckland (NZDT/NZST)</option>
            </select>
          </div>
          <div>
            <label htmlFor="defaultBuyIn" className="block text-sm font-medium mb-1">
              Default Buy-in ({currency})
            </label>
            <Input
              id="defaultBuyIn"
              type="number"
              step="0.01"
              value={defaultBuyIn}
              onChange={(e) => setDefaultBuyIn(e.target.value)}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create League'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

