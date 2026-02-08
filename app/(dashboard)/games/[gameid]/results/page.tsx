import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TotalsBar } from '@/components/games/view/TotalsBar';
import { ResultsSection } from '@/components/games/view/ResultsSection';
import { loadGame } from '@/actions/games';
import { format } from 'date-fns';
import { formatCurrencyWithSign } from '@/lib/money';

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

            {/* Night overview: biggest winner */}
            {game.players.length > 0 && (() => {
                let winner = game.players[0]!;
                for (const p of game.players) {
                    if (p.net != null && (winner.net == null || p.net > winner.net))
                        winner = p;
                }
                if (winner.net != null && winner.net > 0) {
                    return (
                        <div className="border-b bg-card">
                            <div className="container mx-auto max-w-7xl px-4 py-4 lg:px-6">
                                <Card className="border-0 bg-transparent shadow-none">
                                    <CardContent className="py-0">
                                        <p className="text-sm text-muted-foreground">
                                            Biggest winner
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            <Link
                                                href={`/players/${winner.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {winner.name}
                                            </Link>
                                            <span className="ml-2 tabular-nums text-[hsl(var(--success))]">
                                                {formatCurrencyWithSign(winner.net)}
                                            </span>
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

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
