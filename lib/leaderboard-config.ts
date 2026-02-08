/**
 * Leaderboard / stats limits. Used for filtering who appears on leaderboards
 * (e.g. minimum nights played, minimum total buy-in). Update via env and restart.
 *
 * - MIN_NIGHTS_PLAYED: include only players with at least this many games (0 = no limit).
 * - MIN_TOTAL_BUY_IN_CENTS: include only players with at least this much total buy-in in cents (0 = no limit).
 */
export function getLeaderboardLimits(): {
    minNightsPlayed: number;
    minTotalBuyInCents: number;
} {
    const minNights = process.env.MIN_NIGHTS_PLAYED;
    const minBuyIn = process.env.MIN_TOTAL_BUY_IN_CENTS;
    return {
        minNightsPlayed: minNights != null && minNights !== '' ? Math.max(0, parseInt(minNights, 10)) : 0,
        minTotalBuyInCents: minBuyIn != null && minBuyIn !== '' ? Math.max(0, parseInt(minBuyIn, 10)) : 0
    };
}
