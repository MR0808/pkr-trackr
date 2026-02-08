/** All game dates and season grouping use game.scheduledAt and season. */

export type PlayerAllTimeRow = {
    playerId: string;
    name: string;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
    totalGames: number;
    roi: number | null;
    seasonScore: number | null; // ROI * sqrt(buyIn) in dollars
    nightsWon: number;
    podiumPoints: number;
    winRate: number; // nightsWon / totalGames, 0–1
    nightsInProfit: number;
    consistency: number; // nightsInProfit / totalGames, 0–1
};

export type SeasonSummary = {
    seasonId: string;
    name: string;
    startsAt: Date;
    endsAt: Date | null;
    totalGames: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
    players: SeasonPlayerRow[];
    /** Top by profit this season */
    topWinner: { name: string; profitCents: number } | null;
    /** Top by ROI this season (min 1 game) */
    bestROI: { name: string; roi: number } | null;
    /** Top by season score this season */
    bestPerformer: { name: string; seasonScore: number } | null;
};

export type SeasonPlayerRow = {
    playerId: string;
    name: string;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
    totalGames: number;
    roi: number | null;
    seasonScore: number | null;
    nightsWon: number;
    podiumPoints: number;
    winRate: number;
    nightsInProfit: number;
    consistency: number;
};

/** One row for leaderboard (all-time or season). */
export type LeaderboardRow = PlayerAllTimeRow | SeasonPlayerRow;

export type StatsAwards = {
    /** Season (year/name) with highest total profit across all players (that season’s “action”) */
    bestSeason: { seasonName: string; seasonId: string; totalProfitCents: number } | null;
    /** Highest ROI in any single season (min 1 game in that season) */
    bestPlayer: { name: string; playerId: string; roi: number; seasonName: string } | null;
    /** Highest season score in any single season */
    bestPerformer: { name: string; playerId: string; seasonScore: number; seasonName: string } | null;
    /** All-time highest total profit */
    topWinner: { name: string; playerId: string; totalProfitCents: number } | null;
    /** All-time highest total buy-in */
    mostAction: { name: string; playerId: string; totalBuyInCents: number } | null;
    /** All-time most podium points (3/2/1 for 1st/2nd/3rd) */
    podiumKing: { name: string; playerId: string; podiumPoints: number } | null;
    /** All-time most nights won (1st by profit) */
    nightsWonLeader: { name: string; playerId: string; nightsWon: number } | null;
    /** Highest win rate (nights won / games played), min 5 games */
    winRateLeader: { name: string; playerId: string; winRate: number; games: number } | null;
};

export type StatsPageData = {
    allTime: {
        totalGames: number;
        totalBuyInCents: number;
        totalCashOutCents: number;
        totalProfitCents: number;
        players: PlayerAllTimeRow[];
    };
    seasons: SeasonSummary[];
    awards: StatsAwards;
};
