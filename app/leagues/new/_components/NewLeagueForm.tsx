'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeague } from '@/src/server/actions/leagueActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function NewLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const league = await createLeague({ name, description });
      router.push(`/leagues/${league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leagues
        </Link>
      </div>
      <Card className="p-6 card-plain">
        <h1 className="text-2xl font-bold mb-6">Create New League</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              League Name *
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-nav rounded-md bg-white text-foreground dark:bg-[#0f1117] dark:border-[#1f2430]"
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create League'}
            </Button>
            <Link href="/">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}

