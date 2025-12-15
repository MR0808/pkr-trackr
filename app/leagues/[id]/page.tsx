import { getLeague } from '@/src/server/actions/leagueActions';
import { getSeasons } from '@/src/server/actions/seasonActions';
import { getNights } from '@/src/server/actions/nightActions';
import { getLeaderboard } from '@/src/server/actions/leaderboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Link>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          {league.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {league.description}
            </p>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="nights" className="w-full">
          <TabsList>
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

