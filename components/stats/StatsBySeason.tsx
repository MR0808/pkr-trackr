import { format } from 'date-fns';
import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCurrencyWithSign, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { SeasonSummary } from '@/types/stats';

export function StatsBySeason({ seasons }: { seasons: SeasonSummary[] }) {
    if (seasons.length === 0) return null;

    return (
        <div className="min-w-0">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                By season
            </h2>
            <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                Game dates use scheduled night. Each season shows top performers and full table.
            </p>
            <Accordion type="multiple" className="w-full">
                {seasons.map((season) => (
                    <AccordionItem key={season.seasonId} value={season.seasonId}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-wrap items-center gap-2 text-left">
                                <span className="font-semibold">{season.name}</span>
                                <Badge variant="secondary">
                                    {format(season.startsAt, 'yyyy')}
                                </Badge>
                                <span className="text-muted-foreground">
                                    {season.totalGames} games ·{' '}
                                    {formatCurrency(season.totalBuyInCents / 100)}{' '}
                                    in ·{' '}
                                    <span
                                        className={
                                            season.totalProfitCents >= 0
                                                ? 'text-[hsl(var(--success))]'
                                                : 'text-destructive'
                                        }
                                    >
                                        {formatCurrencyWithSign(
                                            season.totalProfitCents / 100
                                        )}{' '}
                                        net
                                    </span>
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex flex-wrap gap-4">
                                    {season.topWinner && (
                                        <Card className="min-w-[140px]">
                                            <CardContent className="pt-4">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Top winner
                                                </p>
                                                <p className="font-semibold">
                                                    <Link
                                                        href={`/players/${season.topWinner.playerId}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {season.topWinner.name}
                                                    </Link>
                                                </p>
                                                <p
                                                    className={cn(
                                                        'text-sm tabular-nums',
                                                        season.topWinner.profitCents >= 0
                                                            ? 'text-[hsl(var(--success))]'
                                                            : 'text-destructive'
                                                    )}
                                                >
                                                    {formatCurrencyWithSign(
                                                        season.topWinner.profitCents /
                                                            100
                                                    )}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {season.bestROI && (
                                        <Card className="min-w-[140px]">
                                            <CardContent className="pt-4">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Best ROI
                                                </p>
                                                <p className="font-semibold">
                                                    <Link
                                                        href={`/players/${season.bestROI.playerId}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {season.bestROI.name}
                                                    </Link>
                                                </p>
                                                <p className="text-sm tabular-nums">
                                                    {formatPercent(
                                                        season.bestROI.roi
                                                    )}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {season.bestPerformer && (
                                        <Card className="min-w-[140px]">
                                            <CardContent className="pt-4">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Best performer
                                                </p>
                                                <p className="font-semibold">
                                                    <Link
                                                        href={`/players/${season.bestPerformer.playerId}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {season.bestPerformer.name}
                                                    </Link>
                                                </p>
                                                <p className="text-sm tabular-nums">
                                                    {season.bestPerformer.seasonScore.toFixed(
                                                        1
                                                    )}{' '}
                                                    score
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                                <div className="overflow-x-auto rounded-md border [-webkit-overflow-scrolling:touch] sm:overflow-visible">
                                    <Table className="w-full min-w-0">
                                        <TableHeader>
                                            <TableRow className="border-b text-xs">
                                                <TableHead className="min-w-0 whitespace-nowrap">
                                                    Player
                                                </TableHead>
                                                <TableHead className="shrink-0 whitespace-nowrap text-right">
                                                    Profit
                                                </TableHead>
                                                <TableHead className="hidden text-right sm:table-cell">
                                                    Buy-ins
                                                </TableHead>
                                                <TableHead className="hidden text-right sm:table-cell">
                                                    ROI
                                                </TableHead>
                                                <TableHead className="hidden text-right sm:table-cell">
                                                    Score
                                                </TableHead>
                                                <TableHead className="shrink-0 text-right">
                                                    Games
                                                </TableHead>
                                                <TableHead className="hidden text-right sm:table-cell">
                                                    Won
                                                </TableHead>
                                                <TableHead className="hidden text-right sm:table-cell">
                                                    Podium
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {season.players
                                                .sort(
                                                    (a, b) =>
                                                        b.totalProfitCents -
                                                        a.totalProfitCents
                                                )
                                                .map((p) => (
                                                    <TableRow
                                                        key={p.playerId}
                                                        className="border-b text-sm last:border-0"
                                                    >
                                                        <TableCell className="min-w-0 font-medium">
                                                            <Link
                                                                href={`/players/${p.playerId}`}
                                                                className="truncate text-primary hover:underline"
                                                            >
                                                                {p.name}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell
                                                            className={cn(
                                                                'shrink-0 text-right tabular-nums',
                                                                p.totalProfitCents >= 0
                                                                    ? 'text-[hsl(var(--success))]'
                                                                    : 'text-destructive'
                                                            )}
                                                        >
                                                            {formatCurrencyWithSign(
                                                                p.totalProfitCents /
                                                                    100
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                            {formatCurrency(
                                                                p.totalBuyInCents /
                                                                    100
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                            {p.roi != null
                                                                ? formatPercent(
                                                                      p.roi
                                                                  )
                                                                : '—'}
                                                        </TableCell>
                                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                            {p.seasonScore !=
                                                            null
                                                                ? p.seasonScore.toFixed(
                                                                      1
                                                                  )
                                                                : '—'}
                                                        </TableCell>
                                                        <TableCell className="shrink-0 text-right tabular-nums">
                                                            {p.totalGames}
                                                        </TableCell>
                                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                            {p.nightsWon}
                                                        </TableCell>
                                                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                                            {p.podiumPoints}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
