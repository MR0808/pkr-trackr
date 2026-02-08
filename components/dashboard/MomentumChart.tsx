'use client';

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import type {
    DashboardMomentumPoint,
    DashboardPageData
} from '@/actions/games';
import { formatCurrencyWithSign } from '@/lib/money';

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 142 76% 36%))',
    'hsl(var(--chart-3, 221 83% 53%))',
    'hsl(var(--chart-4, 280 67% 47%))',
    'hsl(var(--chart-5, 25 95% 53%))'
];

type Props = {
    momentumData: DashboardMomentumPoint[];
    momentumPlayerNames: DashboardPageData['momentumPlayerNames'];
};

export function MomentumChart({ momentumData, momentumPlayerNames }: Props) {
    if (momentumData.length === 0 || momentumPlayerNames.length === 0) return null;

    // Recharts expects array of { nightLabel, [playerId]: value } with numeric values for lines
    const chartData = momentumData.map((point) => {
        const row: Record<string, string | number> = {
            nightLabel: point.nightLabel,
            gameId: point.gameId
        };
        for (const { playerId } of momentumPlayerNames) {
            row[playerId] = (point.cumulativeByPlayer[playerId] ?? 0) / 100;
        }
        return row;
    });

    return (
        <div className="min-h-[280px] min-w-0 rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
                Cumulative profit (top 5)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                    />
                    <XAxis
                        dataKey="nightLabel"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                    />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        tickFormatter={(v) => formatCurrencyWithSign(v)}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 'var(--radius)',
                            border: '1px solid hsl(var(--border))'
                        }}
                        formatter={(value: number) => [
                            formatCurrencyWithSign(value),
                            ''
                        ]}
                        labelFormatter={(label) => `Night: ${label}`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value) => {
                            const p = momentumPlayerNames.find(
                                (x) => x.playerId === value
                            );
                            return p?.name ?? value;
                        }}
                    />
                    {momentumPlayerNames.map(({ playerId }, i) => (
                        <Line
                            key={playerId}
                            type="monotone"
                            dataKey={playerId}
                            name={playerId}
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
