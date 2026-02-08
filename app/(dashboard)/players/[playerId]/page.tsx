import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    loadPlayerProfile,
    loadPlayerComparison
} from '@/actions/playerActions';
import { PlayerProfile } from '@/components/players/PlayerProfile';

export default async function PlayerProfilePage({
    params
}: {
    params: Promise<{ playerId: string }>;
}) {
    const { playerId } = await params;
    const data = await loadPlayerProfile(playerId);

    if (!data) notFound();

    const comparison =
        data.currentSeason?.id != null
            ? await loadPlayerComparison(playerId, data.currentSeason.id)
            : await loadPlayerComparison(playerId, null);

    return (
        <div className="container mx-auto max-w-5xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to dashboard
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/players" className="gap-2">
                        Back to players
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/games">View all games</Link>
                </Button>
            </div>

            <PlayerProfile data={data} comparison={comparison} />
        </div>
    );
}
