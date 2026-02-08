import type { StatsFilters } from '@/schemas/statsFilters';

/** Game where input compatible with prisma.game.findMany({ where }) */
type GameWhereInput = {
    groupId?: string;
    status?: 'OPEN' | 'CLOSED';
    seasonId?: string;
    scheduledAt?: { gte?: Date; lte?: Date };
    AND?: GameWhereInput[];
};

/**
 * Build Prisma where clause for Game (nights) from stats filters.
 * groupId must be applied by caller.
 * Uses a single flat where object so Prisma returns all matching rows.
 */
export function buildGameWhereFromFilters(
    groupId: string,
    filters: StatsFilters
): GameWhereInput {
    const dateRange = String(filters.dateRange ?? 'all');

    const where: GameWhereInput = { groupId };

    if (!filters.includeDraftNights) {
        where.status = 'CLOSED';
    }

    if (filters.seasonId) {
        where.seasonId = filters.seasonId;
    }

    if (dateRange !== 'all') {
        const now = new Date();
        let from: Date;
        if (dateRange === 'custom' && filters.dateFrom) {
            from = new Date(filters.dateFrom);
        } else if (dateRange === '7') {
            from = new Date(now.getTime());
            from.setDate(from.getDate() - 7);
        } else if (dateRange === '30') {
            from = new Date(now.getTime());
            from.setDate(from.getDate() - 30);
        } else if (dateRange === '90') {
            from = new Date(now.getTime());
            from.setDate(from.getDate() - 90);
        } else {
            from = new Date(0);
        }
        where.scheduledAt = { gte: from };
        if (dateRange === 'custom' && filters.dateTo) {
            where.scheduledAt = { ...where.scheduledAt, lte: new Date(filters.dateTo) };
        }
    }

    return where;
}

/** Get effective min nights / min buy-in for eligibility (from filters or league defaults) */
export function getEligibilityThresholds(filters: StatsFilters, defaults: { minNightsPlayed: number; minTotalBuyInCents: number }) {
    return {
        minNightsPlayed: filters.minNightsPlayed ?? defaults.minNightsPlayed,
        minTotalBuyInCents: filters.minTotalBuyInCents ?? defaults.minTotalBuyInCents
    };
}
