import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { getLeagues } from '@/src/server/actions/leagueActions';
import { checkOnboardingStatus } from '@/src/server/actions/onboardingActions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppNav } from '@/components/navigation/AppNav';

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Check onboarding status
  const onboarding = await checkOnboardingStatus();
  if (onboarding.needsOnboarding) {
    redirect('/onboarding/welcome');
  }

  const leagues = await getLeagues();

  return (
    <div className="min-h-screen bg-app">
      <AppNav />

      <main className="container mx-auto px-4 py-8">
        <section className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-muted">Overview</p>
            <h2 className="text-3xl font-bold mt-1">My Leagues</h2>
            <p className="text-sm text-brand-muted mt-2">
              Track cash games, nights, and performance in one place.
            </p>
          </div>
          <Link href="/leagues/new">
            <Button>Create League</Button>
          </Link>
        </section>

        {leagues.length === 0 ? (
          <Card className="p-8 text-center card-plain">
            <p className="text-brand-muted mb-4">You don't have any leagues yet.</p>
            <Link href="/leagues/new">
              <Button>Create Your First League</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <Card className="p-6 card-plain hover:border-nav transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{league.name}</h3>
                      {league.description && (
                        <p className="text-sm text-brand-muted mb-4">
                          {league.description}
                        </p>
                      )}
                    </div>
                    <div className="pill text-xs text-brand-profit bg-brand-profit/10 border-brand-profit/30 text-brand-profit">
                      Active
                    </div>
                  </div>
                  {league.description && (
                    <p className="text-xs text-brand-muted mb-4">
                      {league.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">
                      {league.members.length} member{league.members.length !== 1 ? 's' : ''}
                    </span>
                    {league.seasons.length > 0 && (
                      <span className="text-brand-muted">
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
