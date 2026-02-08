'use client';

import { format } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { formatCurrency } from '@/lib/money';
import type { ActivityTrendPoint } from '@/types/stats';
import { ChartContainer } from './ChartContainer';

type Props = {
    data: ActivityTrendPoint[];
};

export function PotTrendChart({ data }: Props) {
    const chartData = data.map((t) => ({
        ...t,
        pot: t.potCents / 100
    }));

    if (chartData.length === 0) return null;

    return (
        <ChartContainer className="h-[280px] w-full min-w-0">
            {(width, height) => (
                <LineChart
                    width={width}
                    height={height}
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => format(new Date(v), 'MMM d')}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                        formatter={(value: number | undefined) => [
                            value != null ? formatCurrency(value) : '—',
                            'Pot'
                        ]}
                        labelFormatter={(label) =>
                            format(new Date(label), 'MMM d, yyyy')
                        }
                    />
                    <Line
                        type="monotone"
                        dataKey="pot"
                        name="Pot"
                        stroke="oklch(0.55 0.22 25)"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                    />
                </LineChart>
            )}
        </ChartContainer>
    );
}
