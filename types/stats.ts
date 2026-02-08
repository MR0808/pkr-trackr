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
    topWinner: { name: string; playerId: string; profitCents: number } | null;
    /** Top by ROI this season (min 1 game) */
    bestROI: { name: string; playerId: string; roi: number } | null;
    /** Top by season score this season */
    bestPerformer: { name: string; playerId: string; seasonScore: number } | null;
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
    /** League health overview: avg pot, most recent winner */
    leagueHealth: {
        averagePotCents: number;
        mostRecentWinner: {
            gameId: string;
            gameName: string;
            playerId: string;
            name: string;
        } | null;
    };
    /** Count of players with total profit > 0 vs <= 0 (all players with at least one game) */
    profitDistribution: { profitable: number; nonProfitable: number };
};

/* ----- Stats area (filtered) ----- */

export type LeagueStatsOverview = {
    totalNights: number;
    totalPotCents: number;
    averagePotCents: number;
    averagePotLast10Cents: number | null;
    largestPotCents: number;
    uniquePlayersAllTime: number;
    uniquePlayersLast30Days: number;
    averagePlayersPerNight: number;
};

export type RecentNightRow = {
    gameId: string;
    date: Date;
    potCents: number;
    playersCount: number;
    biggestWinnerName: string;
    biggestWinnerPlayerId: string;
    biggestWinnerProfitCents: number;
};

export type ActivityTrendPoint = {
    date: string;
    potCents: number;
    playersCount: number;
};

export type RecordItem = {
    label: string;
    value: string;
    playerId?: string;
    gameId?: string;
    playerName?: string;
};

export type NightTableRow = {
    gameId: string;
    date: Date;
    status: 'OPEN' | 'CLOSED';
    potCents: number;
    playersCount: number;
    biggestWinnerName: string | null;
    biggestWinnerPlayerId: string | null;
    biggestWinnerProfitCents: number | null;
    biggestLoserName: string | null;
    biggestLoserPlayerId: string | null;
    biggestLoserLossCents: number | null;
    rebuysCount: number;
};

export type SeasonTableRow = {
    seasonId: string;
    name: string;
    startsAt: Date;
    endsAt: Date | null;
    nights: number;
    totalPotCents: number;
    avgPotCents: number;
    playersParticipated: number;
    mostProfitablePlayerName: string | null;
    mostProfitablePlayerId: string | null;
    mostProfitableProfitCents: number | null;
    bestRoiPlayerName: string | null;
    bestRoiPlayerId: string | null;
    bestRoi: number | null;
};

export type PlayerStatsRow = {
    playerId: string;
    name: string;
    nightsPlayed: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    totalProfitCents: number;
    roi: number | null;
    performanceScore: number | null;
    winRate: number;
    bestNightProfitCents: number | null;
    worstNightLossCents: number | null;
    meetsEligibility: boolean;
};

export type RollingFormRow = {
    playerId: string;
    name: string;
    profitLastN: number;
    roiLastN: number | null;
    trendDirection: 'up' | 'down' | 'flat';
};

export type CompetitivenessResult = {
    top1ShareOfPositiveProfit: number;
    top3ShareOfPositiveProfit: number;
    badge: 'Dominated' | 'Competitive';
};

export type DistributionBucket = {
    label: string;
    count: number;
};

export type SkillRatingRow = {
    playerId: string;
    name: string;
    rating: number;
    changeLastN: number;
};

export type InsightsNarrative = {
    summary: string;
    roiLeader: string | null;
    profitLeader: string | null;
    scoreLeader: string | null;
    hottestLast10: string | null;
    potTrend: string;
    competitiveness: string;
    attendance: string;
};

export type HeaterIndexRow = {
    playerId: string;
    name: string;
    heaterNightCount: number;
};
