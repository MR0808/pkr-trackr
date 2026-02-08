import { loadPlayersListPageData } from '@/actions/playerActions';
import { PlayersList } from '@/components/players/PlayersList';

export default async function PlayersPage() {
    const data = await loadPlayersListPageData();

    return (
        <div className="container mx-auto max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Players
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    Everyone in your group and their all-time stats
                </p>
            </div>

            <PlayersList data={data} />
        </div>
    );
}
