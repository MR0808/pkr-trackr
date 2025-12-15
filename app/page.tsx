import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { getLeagues } from '@/src/server/actions/leagueActions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { SignOutButton } from './_components/SignOutButton';

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const leagues = await getLeagues();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pkr Trackr</h1>
          <div className="flex items-center gap-4">
            {(session.user as any).isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">My Leagues</h2>
          <Link href="/leagues/new">
            <Button>Create League</Button>
          </Link>
        </div>

        {leagues.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You don't have any leagues yet.
            </p>
            <Link href="/leagues/new">
              <Button>Create Your First League</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-xl font-semibold mb-2">{league.name}</h3>
                  {league.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      {league.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {league.members.length} member{league.members.length !== 1 ? 's' : ''}
                    </span>
                    {league.seasons.length > 0 && (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Active Season
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
