import {
    Target,
    Zap,
    TrendingUp,
    Flame,
    Award,
    Crown,
    Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/money';
import type { StatsAwards } from '@/types/stats';

const awardsConfig: {
    key: keyof StatsAwards;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    getValue: (a: NonNullable<StatsAwards[keyof StatsAwards]>) => string;
    sub?: (a: NonNullable<StatsAwards[keyof StatsAwards]>) => string;
}[] = [
    {
        key: 'bestPlayer',
        title: 'Best player (ROI)',
        icon: Target,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => `${formatPercent((a as { roi: number }).roi)} in ${(a as { seasonName: string }).seasonName}`
    },
    {
        key: 'bestPerformer',
        title: 'Best performer (score)',
        icon: Zap,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => `${(a as { seasonScore: number }).seasonScore.toFixed(1)} in ${(a as { seasonName: string }).seasonName}`
    },
    {
        key: 'topWinner',
        title: 'Top winner',
        icon: TrendingUp,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => formatCurrency((a as { totalProfitCents: number }).totalProfitCents / 100)
    },
    {
        key: 'mostAction',
        title: 'Most action',
        icon: Flame,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => formatCurrency((a as { totalBuyInCents: number }).totalBuyInCents / 100)
    },
    {
        key: 'podiumKing',
        title: 'Podium king',
        icon: Award,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => `${(a as { podiumPoints: number }).podiumPoints} pts (3/2/1 for 1st/2nd/3rd)`
    },
    {
        key: 'nightsWonLeader',
        title: 'Nights won',
        icon: Crown,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => `${(a as { nightsWon: number }).nightsWon} first-place finishes`
    },
    {
        key: 'winRateLeader',
        title: 'Win rate (min 5 games)',
        icon: Percent,
        getValue: (a) => (a as { name: string }).name,
        sub: (a) => `${formatPercent((a as { winRate: number }).winRate)} (${(a as { games: number }).games} games)`
    }
];

export function StatsAwardsSection({ awards }: { awards: StatsAwards }) {
    return (
        <div className="min-w-0">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">Awards</h2>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {awardsConfig.map(({ key, title, icon: Icon, getValue, sub }) => {
                    const value = awards[key];
                    return (
                        <Card key={key}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {value ? (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {getValue(value)}
                                        </div>
                                        {sub && (
                                            <p className="text-xs text-muted-foreground">
                                                {sub(value)}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        —
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
