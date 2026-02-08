import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminGetGameForEdit } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminGameEditForm } from './AdminGameEditForm';

type Props = { params: Promise<{ gameId: string }> };

export default async function AdminGameEditPage({ params }: Props) {
    const { gameId } = await params;
    const data = await adminGetGameForEdit(gameId);
    if (!data) notFound();
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/games">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit buy-ins</h1>
                    <p className="text-muted-foreground">{data.game.name}</p>
                </div>
            </div>
            <AdminGameEditForm gameId={gameId} game={data.game} initialPlayers={data.players} />
        </div>
    );
}
