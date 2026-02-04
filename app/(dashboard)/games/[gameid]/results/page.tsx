import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { TotalsBar } from '@/components/games/view/TotalsBar';
import { ResultsSection } from '@/components/games/view/ResultsSection';
import { loadGame } from '@/actions/games';
import { format } from 'date-fns';

interface ResultsPageProps {
    params: Promise<{
        gameid: string;
    }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const { gameid } = await params;
    const { game, totals, shareId } = await loadGame(gameid);

    if (!game || !totals) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6">
                    <div className="mb-2 text-center">
                        <h1 className="mb-2 text-2xl font-bold lg:text-3xl">
                            PkrTrackr
                        </h1>
                        <p className="text-sm text-muted-foreground lg:text-base">
                            Track the cash. Not the drama.
                        </p>
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <h2 className="text-xl font-semibold lg:text-2xl">
                            {game.name}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                                {format(
                                    new Date(game.scheduledAt),
                                    'EEE d MMM yyyy'
                                )}
                            </Badge>
                            <Badge variant="default">CLOSED</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Totals */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6">
                    <TotalsBar
                        totals={totals}
                        playerCount={game.players.length}
                    />
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6">
                <ResultsSection
                    game={game}
                    totals={totals}
                    shareId={shareId ?? null}
                />
            </div>
        </main>
    );
}
