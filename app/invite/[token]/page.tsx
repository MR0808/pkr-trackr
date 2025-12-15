'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptInvite } from '@/src/server/actions/leagueActions';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const token = params.token as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?redirect=/invite/${token}`);
    }
  }, [session, isPending, router, token]);

  const handleAccept = async () => {
    setError('');
    setLoading(true);

    try {
      await acceptInvite({ token });
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Accept League Invitation</h1>
        {success ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400">
              Invitation accepted! Redirecting...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <p className="text-zinc-600 dark:text-zinc-400">
              You've been invited to join a league. Click below to accept the invitation.
            </p>
            <Button onClick={handleAccept} className="w-full" disabled={loading}>
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Link href="/" className="block text-center text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
              Go to Dashboard
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

