import { adminListPlayers } from '@/actions/admin';
import { AdminPlayersClient } from './AdminPlayersClient';

export default async function AdminPlayersPage() {
    const players = await adminListPlayers();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Players</h1>
                <p className="text-muted-foreground">Add and edit players in the league.</p>
            </div>
            <AdminPlayersClient initialPlayers={players} />
        </div>
    );
}
