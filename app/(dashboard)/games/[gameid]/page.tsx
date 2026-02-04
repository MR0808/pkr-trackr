import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getGame, calculateGameTotals } from '@/lib/mock-db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TotalsBar } from '@/components/games/view/TotalsBar';
// import { CloseGameDialog } from '@/components/games/view/CloseGameDialog';
import { CashierClient } from '@/components/games/view/CashierClient';
import { loadGame } from '@/actions/games';

interface CashierPageProps {
    params: Promise<{
        gameid: string;
    }>;
}

export default async function CashierPage({ params }: CashierPageProps) {
    const { gameid } = await params;
    const { game, totals } = await loadGame(gameid);

    if (!game || !totals) {
        notFound();
    }

    return (
        <main className="min-h-screen pb-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container mx-auto max-w-7xl px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex flex-col gap-3">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="w-fit"
                        >
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-4">
                            <div className="flex items-center gap-2 lg:gap-3">
                                <h1 className="text-xl font-bold lg:text-2xl">
                                    {game.name}
                                </h1>
                                <Badge
                                    variant={
                                        game.status === 'OPEN'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs lg:text-sm"
                                >
                                    {game.status}
                                </Badge>
                            </div>
                            {/* <CloseGameDialog
                                gameId={game.id}
                                totals={totals}
                                isGameClosed={game.status === 'CLOSED'}
                            /> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Totals Bar - No longer sticky */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto max-w-7xl px-4 py-3 lg:px-6 lg:py-4">
                    <TotalsBar totals={totals} />
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-6">
                <CashierClient game={game} />
            </div>
        </main>
    );
}
