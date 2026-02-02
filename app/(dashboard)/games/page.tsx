import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GamesList } from '@/components/dashboard/GamesList';
import { loadGamesForGroup } from '@/actions/games';

export default async function GamesPage() {
    const games = await loadGamesForGroup({
        groupId: 'cml531khu0000kgf58q0meaku'
    });

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Games</h1>
                    <p className="text-muted-foreground">
                        Manage all your poker game sessions
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/">
                        <Plus className="mr-2 h-5 w-5" />
                        New Game
                    </Link>
                </Button>
            </div>

            <GamesList games={games} />
        </div>
    );
}
