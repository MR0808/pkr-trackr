import { getLeague } from '@/src/server/actions/leagueActions';
import { getSeasons } from '@/src/server/actions/seasonActions';
import { getNights } from '@/src/server/actions/nightActions';
import { getLeaderboard } from '@/src/server/actions/leaderboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppNav } from '@/components/navigation/AppNav';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NightsTab } from './_components/NightsTab';
import { LeaderboardsTab } from './_components/LeaderboardsTab';
import { SettingsTab } from './_components/SettingsTab';

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const league = await getLeague(id);
  const seasons = await getSeasons(id);

  const activeSeason = seasons.find((s) => s.isActive) || seasons[0];
  const nights = activeSeason ? await getNights(activeSeason.id) : [];

  return (
    <div className="min-h-screen bg-app">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-brand-muted hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Link>
          <h1 className="text-3xl font-bold">{league.name}</h1>
          {league.description && (
            <p className="text-sm text-brand-muted mt-2">
              {league.description}
            </p>
          )}
        </div>
        <Tabs defaultValue="nights" className="w-full">
          <TabsList className="surface">
            <TabsTrigger value="nights">Nights</TabsTrigger>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="nights">
            <NightsTab
              leagueId={id}
              seasons={seasons}
              activeSeason={activeSeason}
              nights={nights}
            />
          </TabsContent>

          <TabsContent value="leaderboards">
            <LeaderboardsTab leagueId={id} activeSeason={activeSeason} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab league={league} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

