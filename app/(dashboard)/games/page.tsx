import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GamesList } from '@/components/games/list/GamesList';
import { loadGamesListPageData } from '@/actions/games';
import { getDefaultGroupId } from '@/lib/default-group';

export default async function GamesPage() {
    const groupId = await getDefaultGroupId();
    const data = await loadGamesListPageData({ groupId });

    return (
        <div className="container mx-auto max-w-7xl space-y-4 overflow-x-hidden px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Games</h1>
                    <p className="text-muted-foreground">
                        Manage all your poker game sessions
                    </p>
                </div>
                {/* <Button asChild size="lg">
                    <Link href="/">
                        <Plus className="mr-2 h-5 w-5" />
                        New Game
                    </Link>
                </Button> */}
            </div>

            <GamesList data={data} />
        </div>
    );
}
