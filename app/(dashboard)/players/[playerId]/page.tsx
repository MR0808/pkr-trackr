import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadPlayerProfile } from '@/actions/playerActions';
import { PlayerProfile } from '@/components/players/PlayerProfile';

export default async function PlayerProfilePage({
    params
}: {
    params: Promise<{ playerId: string }>;
}) {
    const { playerId } = await params;
    const data = await loadPlayerProfile(playerId);

    if (!data) notFound();

    return (
        <div className="container mx-auto max-w-4xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/players" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to players
                </Link>
            </Button>

            <PlayerProfile data={data} />
        </div>
    );
}
