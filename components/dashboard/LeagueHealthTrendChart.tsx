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
import type { HealthTrendSeries } from '@/actions/games';
import { formatCurrencyWithSign } from '@/lib/money';

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 142 76% 36%))',
    'hsl(var(--chart-3, 221 83% 53%))',
    'hsl(var(--chart-4, 280 67% 47%))',
    'hsl(var(--chart-5, 25 95% 53%))'
];

type Props = {
    nightLabels: string[];
    series: HealthTrendSeries[];
};

export function LeagueHealthTrendChart({ nightLabels, series }: Props) {
    if (nightLabels.length === 0 || series.length === 0) return null;

    const chartData = nightLabels.map((label, i) => {
        const row: Record<string, string | number> = { nightLabel: label };
        for (const s of series) {
            row[s.playerId] = (s.data[i] ?? 0) / 100;
        }
        return row;
    });

    return (
        <div className="min-h-[280px] min-w-0 rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
                League health trend (cumulative profit, last 10 nights)
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
                        formatter={(value: number | undefined) => [
                            formatCurrencyWithSign(value ?? 0),
                            ''
                        ]}
                        labelFormatter={(label) => `Night: ${label}`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value) =>
                            series.find((s) => s.playerId === value)?.name ?? value
                        }
                    />
                    {series.map((s, i) => (
                        <Line
                            key={s.playerId}
                            type="monotone"
                            dataKey={s.playerId}
                            name={s.playerId}
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
