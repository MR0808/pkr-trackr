'use client';

import { format } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/lib/money';
import type { ActivityTrendPoint } from '@/types/stats';

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
        <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
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
            </ResponsiveContainer>
        </div>
    );
}
