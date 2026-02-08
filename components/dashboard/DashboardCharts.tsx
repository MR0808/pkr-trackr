'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import type { DashboardMonthlyRow } from '@/actions/games';
import { formatCurrency } from '@/lib/money';

function formatMonth(month: string) {
    const [y, m] = month.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function DashboardCharts({ monthly }: { monthly: DashboardMonthlyRow[] }) {
    const chartData = monthly.map((row) => ({
        ...row,
        monthLabel: formatMonth(row.month),
        buyInDollars: row.totalBuyInCents / 100,
        netDollars: row.netCents / 100
    }));

    if (chartData.length === 0) return null;

    return (
        <div className="grid min-w-0 gap-6 sm:grid-cols-1 lg:grid-cols-2">
            <div className="min-h-[280px] min-w-0 rounded-lg border bg-card p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Games per month
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                        />
                        <XAxis
                            dataKey="monthLabel"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 'var(--radius)',
                                border: '1px solid hsl(var(--border))'
                            }}
                            labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.monthLabel
                            }
                            formatter={(value: number) => [
                                `${value} game${value !== 1 ? 's' : ''}`,
                                'Games'
                            ]}
                        />
                        <Bar
                            dataKey="gameCount"
                            name="Games"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="min-h-[280px] min-w-0 rounded-lg border bg-card p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Buy-ins per month
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                        />
                        <XAxis
                            dataKey="monthLabel"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            tickFormatter={(v) =>
                                v >= 1000 ? `$${v / 1000}k` : `$${v}`
                            }
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 'var(--radius)',
                                border: '1px solid hsl(var(--border))'
                            }}
                            formatter={(value: number) => [
                                formatCurrency(value),
                                'Buy-ins'
                            ]}
                        />
                        <Bar
                            dataKey="buyInDollars"
                            name="Buy-ins"
                            fill="hsl(var(--primary) / 0.8)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
