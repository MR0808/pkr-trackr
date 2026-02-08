import { adminListSeasons } from '@/actions/admin';
import { AdminSeasonsClient } from './AdminSeasonsClient';

export default async function AdminSeasonsPage() {
    const seasons = await adminListSeasons();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Seasons</h1>
                <p className="text-muted-foreground">Create and manage seasons. Lock a season to prevent changes.</p>
            </div>
            <AdminSeasonsClient initialSeasons={seasons} />
        </div>
    );
}
