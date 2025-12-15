import { getNight } from '@/src/server/actions/nightActions';
import { getPlayers } from '@/src/server/actions/playerActions';
import { NightEntries } from './_components/NightEntries';
import Link from 'next/link';

export default async function NightPage({
  params,
}: {
  params: Promise<{ id: string; nightId: string }>;
}) {
  const { id: leagueId, nightId } = await params;
  const night = await getNight(nightId);
  const players = await getPlayers(leagueId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 mb-2"
          >
            ← Back to League
          </Link>
          <h1 className="text-2xl font-bold">
            {new Date(night.date).toLocaleDateString()}
          </h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <NightEntries
          leagueId={leagueId}
          night={night}
          players={players}
        />
      </main>
    </div>
  );
}

