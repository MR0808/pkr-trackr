import { adminListGames } from '@/actions/admin';
import { getSeasonsForFilter } from '@/lib/stats-queries';
import { getDefaultGroupId } from '@/lib/default-group';
import { AdminGamesClient } from './AdminGamesClient';

export default async function AdminGamesPage() {
    const [games, groupId] = await Promise.all([
        adminListGames(),
        getDefaultGroupId()
    ]);
    const seasonOptions = await getSeasonsForFilter(groupId);
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Games</h1>
                <p className="text-muted-foreground">Create, edit, and close games.</p>
            </div>
            <AdminGamesClient initialGames={games} seasonOptions={seasonOptions} />
        </div>
    );
}
