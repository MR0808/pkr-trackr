/**
 * Client-safe formatting and calculation utilities
 * These functions are pure and don't depend on server-only code
 */

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

/**
 * Calculate night pot from entries
 */
export function calculateNightPot(entries: Array<{ buyInTotalCents: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.buyInTotalCents, 0);
}

/**
 * Calculate metrics for a single entry
 */
export function calculateEntryMetrics(
  buyInTotalCents: number,
  cashOutTotalCents: number,
  nightPotCents: number
) {
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

