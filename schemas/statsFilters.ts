import { z } from 'zod';

/** Date range preset for stats filters */
export const dateRangePresetSchema = z.enum(['all', '7', '30', '90', 'custom']);
export type DateRangePreset = z.infer<typeof dateRangePresetSchema>;

/** Custom date range (when preset is 'custom') */
export const customDateRangeSchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
});

/** Rolling window for "form" metrics (last N nights) */
export const rollingNightsSchema = z.union([
    z.literal(5),
    z.literal(10),
    z.literal(20)
]);
export type RollingNights = z.infer<typeof rollingNightsSchema>;

/** Top N for charts (limit series) */
export const topNSchema = z.union([
    z.literal(3),
    z.literal(5),
    z.literal(10)
]);
export type TopN = z.infer<typeof topNSchema>;

/** Stats filter schema – validated on server from searchParams */
export const statsFiltersSchema = z.object({
    dateRange: dateRangePresetSchema.default('all'),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    seasonId: z.string().uuid().optional().nullable(),
    rollingNights: z
        .union([z.literal(5), z.literal(10), z.literal(20)])
        .or(
            z
                .string()
                .transform((s): 5 | 10 | 20 =>
                    [5, 10, 20].includes(Number(s))
                        ? (Number(s) as 5 | 10 | 20)
                        : 10
                )
        )
        .default(10),
    minNightsPlayed: z.coerce.number().int().min(0).optional(),
    minTotalBuyInCents: z.coerce.number().int().min(0).optional(),
    topN: z
        .union([z.literal(3), z.literal(5), z.literal(10)])
        .or(
            z
                .string()
                .transform((s): 3 | 5 | 10 =>
                    [3, 5, 10].includes(Number(s))
                        ? (Number(s) as 3 | 5 | 10)
                        : 5
                )
        )
        .default(5),
    includeGuestPlayers: z
        .union([z.literal('true'), z.literal('false')])
        .transform((v) => v === 'true')
        .default(true),
    includeDraftNights: z
        .union([z.literal('true'), z.literal('false')])
        .transform((v) => v === 'true')
        .default(false)
});

export type StatsFilters = z.infer<typeof statsFiltersSchema>;

/** Parse and validate raw search params (e.g. from URL). Uses defaults for missing values. */
export function parseStatsFiltersFromSearchParams(
    params: Record<string, string | string[] | undefined>
): StatsFilters {
    const single = (v: string | string[] | undefined): string | undefined =>
        Array.isArray(v) ? v[0] : v;

    const result = statsFiltersSchema.safeParse({
        dateRange: single(params.dateRange) ?? 'all',
        dateFrom: single(params.dateFrom),
        dateTo: single(params.dateTo),
        seasonId: (() => {
            const s = single(params.seasonId);
            return s && s.trim() ? s : undefined;
        })(),
        rollingNights: single(params.rollingNights) ?? '10',
        minNightsPlayed: single(params.minNightsPlayed),
        minTotalBuyInCents: single(params.minTotalBuyInCents),
        topN: single(params.topN) ?? '5',
        includeGuestPlayers: single(params.includeGuestPlayers) ?? 'true',
        includeDraftNights: single(params.includeDraftNights) ?? 'false'
    });

    return result.success ? result.data : statsFiltersSchema.parse({});
}
