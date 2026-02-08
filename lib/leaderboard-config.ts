/**
 * Leaderboard / stats limits for OVERALL / ALL-TIME stats only.
 * Season tables and per-night data include everyone (no minimum).
 *
 * - MIN_NIGHTS_PLAYED: minimum nights played to appear in all-time leaderboard,
 *   dashboard overall stats (who's hot, balance, big moments), and all-time awards.
 *   Default 3 if unset. Set to 0 to include everyone.
 * - MIN_TOTAL_BUY_IN_CENTS: minimum total buy-in (cents) for all-time; 0 = no limit.
 */
const DEFAULT_MIN_NIGHTS_PLAYED = 3;

export function getLeaderboardLimits(): {
    minNightsPlayed: number;
    minTotalBuyInCents: number;
} {
    const minNights = process.env.MIN_NIGHTS_PLAYED;
    const minBuyIn = process.env.MIN_TOTAL_BUY_IN_CENTS;
    return {
        minNightsPlayed:
            minNights != null && minNights !== ''
                ? Math.max(0, parseInt(minNights, 10))
                : DEFAULT_MIN_NIGHTS_PLAYED,
        minTotalBuyInCents:
            minBuyIn != null && minBuyIn !== ''
                ? Math.max(0, parseInt(minBuyIn, 10))
                : 0
    };
}
