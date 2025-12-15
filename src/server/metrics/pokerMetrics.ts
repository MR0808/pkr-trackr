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

// Re-export client-safe functions for server use
export { calculateEntryMetrics, calculateNightPot } from '@/src/lib/format';

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

// Re-export client-safe formatting functions for server use
export { formatCents, formatPercentage } from '@/src/lib/format';

