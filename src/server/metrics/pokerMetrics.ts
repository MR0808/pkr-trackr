/**
 * Poker Metrics Calculation Module
 * Single source of truth for all poker performance metrics
 */

export interface EntryMetrics {
  profit: number; // in cents
  roi: number; // percentage (e.g., 0.15 = 15%)
  performanceScore: number;
  tableShare: number; // percentage (e.g., 0.25 = 25%)
  potWeightedScore: number;
}

export interface SeasonMetrics {
  totalProfit: number; // in cents
  totalBuyIn: number; // in cents
  seasonROI: number; // percentage
  seasonScore: number; // sum of pot-weighted scores
  nightsPlayed: number;
  bestSingleNight: {
    nightId: string;
    score: number;
  } | null;
  bestTableShare: number; // percentage
}

/**
 * Calculate metrics for a single entry
 */
export function calculateEntryMetrics(
  buyInTotalCents: number,
  cashOutTotalCents: number,
  nightPotCents: number
): EntryMetrics {
  const profit = cashOutTotalCents - buyInTotalCents;
  const roi = buyInTotalCents === 0 ? 0 : profit / buyInTotalCents;
  const performanceScore = roi * Math.sqrt(buyInTotalCents);
  const tableShare = nightPotCents === 0 ? 0 : profit / nightPotCents;
  const potWeightedScore =
    performanceScore * Math.sqrt(Math.max(nightPotCents, 0) / 10000);

  return {
    profit,
    roi,
    performanceScore,
    tableShare,
    potWeightedScore,
  };
}

/**
 * Calculate night pot from entries
 */
export function calculateNightPot(entries: Array<{ buyInTotalCents: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.buyInTotalCents, 0);
}

/**
 * Calculate season metrics for a player
 */
export function calculateSeasonMetrics(
  entries: Array<{
    id: string;
    nightId: string;
    buyInTotalCents: number;
    cashOutTotalCents: number;
    night: {
      id: string;
      status: string;
      entries: Array<{ buyInTotalCents: number }>;
    };
  }>
): SeasonMetrics {
  // Only count FINAL nights
  const finalEntries = entries.filter(
    (entry) => entry.night.status === 'FINAL'
  );

  if (finalEntries.length === 0) {
    return {
      totalProfit: 0,
      totalBuyIn: 0,
      seasonROI: 0,
      seasonScore: 0,
      nightsPlayed: 0,
      bestSingleNight: null,
      bestTableShare: 0,
    };
  }

  const totalBuyIn = finalEntries.reduce(
    (sum, entry) => sum + entry.buyInTotalCents,
    0
  );
  const totalCashOut = finalEntries.reduce(
    (sum, entry) => sum + entry.cashOutTotalCents,
    0
  );
  const totalProfit = totalCashOut - totalBuyIn;
  const seasonROI = totalBuyIn === 0 ? 0 : totalProfit / totalBuyIn;

  // Calculate metrics per night
  const nightMetrics = finalEntries.map((entry) => {
    const nightPot = calculateNightPot(entry.night.entries);
    const metrics = calculateEntryMetrics(
      entry.buyInTotalCents,
      entry.cashOutTotalCents,
      nightPot
    );
    return {
      nightId: entry.nightId,
      ...metrics,
    };
  });

  const seasonScore = nightMetrics.reduce(
    (sum, m) => sum + m.potWeightedScore,
    0
  );

  const bestSingleNight = nightMetrics.reduce(
    (best, current) => {
      if (!best || current.potWeightedScore > best.score) {
        return {
          nightId: current.nightId,
          score: current.potWeightedScore,
        };
      }
      return best;
    },
    null as { nightId: string; score: number } | null
  );

  const bestTableShare = Math.max(
    ...nightMetrics.map((m) => m.tableShare),
    0
  );

  // Count unique nights
  const uniqueNights = new Set(finalEntries.map((e) => e.nightId));
  const nightsPlayed = uniqueNights.size;

  return {
    totalProfit,
    totalBuyIn,
    seasonROI,
    seasonScore,
    nightsPlayed,
    bestSingleNight,
    bestTableShare,
  };
}

/**
 * Format cents to dollars for display
 */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

