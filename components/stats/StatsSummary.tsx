import { Gamepad2, DollarSign, TrendingUp, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/money';

export type StatsSummaryTotals = {
    totalGames: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
};

export function StatsSummary({ summary }: { summary: StatsSummaryTotals }) {
    return (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total games
                    </CardTitle>
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalGames}</div>
                    <p className="text-xs text-muted-foreground">
                        Closed nights (by scheduled date)
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total buy-ins
                    </CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary.totalBuyInCents / 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        All player buy-ins combined
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total cash-outs
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary.totalCashOutCents / 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        All player cash-outs combined
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Net profit (group)
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div
                        className={`text-2xl font-bold ${
                            summary.totalProfitCents >= 0
                                ? 'text-[hsl(var(--success))]'
                                : 'text-destructive'
                        }`}
                    >
                        {formatCurrency(summary.totalProfitCents / 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cash-out minus buy-in
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
