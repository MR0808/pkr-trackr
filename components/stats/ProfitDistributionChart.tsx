'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { formatPercent } from '@/lib/money';

type Props = {
    profitable: number;
    nonProfitable: number;
};

export function ProfitDistributionChart({ profitable, nonProfitable }: Props) {
    const total = profitable + nonProfitable;
    if (total === 0) return null;

    const data = [
        { name: 'Profitable', count: profitable, pct: profitable / total, fill: 'var(--success)' },
        { name: 'Not profitable', count: nonProfitable, pct: nonProfitable / total, fill: 'var(--destructive)' }
    ].filter((d) => d.count > 0);

    if (data.length === 0) return null;

    return (
        <div className="min-h-[200px] min-w-0 rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
                Profit distribution (all players with at least one game)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                    />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        allowDecimals={false}
                    />
                    <Bar dataKey="count" name="Players" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={entry.name} fill={entry.fill} />
                        ))}
                    </Bar>
                    <Bar dataKey="pct" name="Share" hide />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                    Profitable: <strong className="text-[hsl(var(--success))]">{profitable}</strong>{' '}
                    ({formatPercent(profitable / total)})
                </span>
                <span>
                    Not profitable: <strong className="text-destructive">{nonProfitable}</strong>{' '}
                    ({formatPercent(nonProfitable / total)})
                </span>
            </div>
        </div>
    );
}
