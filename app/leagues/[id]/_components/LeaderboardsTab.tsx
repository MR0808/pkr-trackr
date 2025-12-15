'use client';

import { useState, useEffect } from 'react';
import { getLeaderboard } from '@/src/server/actions/leaderboardActions';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCents, formatPercentage } from '@/src/lib/format';
import { Trophy, DollarSign, TrendingUp, Activity, Star, Target } from 'lucide-react';

interface LeaderboardsTabProps {
  leagueId: string;
  activeSeason: {
    id: string;
    name: string;
  } | null;
}

type LeaderboardType =
  | 'best-player'
  | 'top-winner'
  | 'best-performer'
  | 'most-action'
  | 'best-night'
  | 'biggest-table-take';

export function LeaderboardsTab({ leagueId, activeSeason }: LeaderboardsTabProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<LeaderboardType>('best-player');

  useEffect(() => {
    if (!activeSeason) return;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard({
          leagueId,
          seasonId: activeSeason.id,
          type,
          minNights: 3,
        });
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [leagueId, activeSeason, type]);

  if (!activeSeason) {
    return (
      <Card className="p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No active season. Create a season first.
        </p>
      </Card>
    );
  }

  const getIcon = (t: LeaderboardType) => {
    switch (t) {
      case 'best-player':
        return <Trophy className="w-4 h-4" />;
      case 'top-winner':
        return <DollarSign className="w-4 h-4" />;
      case 'best-performer':
        return <TrendingUp className="w-4 h-4" />;
      case 'most-action':
        return <Activity className="w-4 h-4" />;
      case 'best-night':
        return <Star className="w-4 h-4" />;
      case 'biggest-table-take':
        return <Target className="w-4 h-4" />;
    }
  };

  const getTitle = (t: LeaderboardType) => {
    switch (t) {
      case 'best-player':
        return 'Best Player (Skill)';
      case 'top-winner':
        return 'Top Winner';
      case 'best-performer':
        return 'Best Performer';
      case 'most-action':
        return 'Most Action';
      case 'best-night':
        return 'Best Night';
      case 'biggest-table-take':
        return 'Biggest Table Take';
    }
  };

  const getValue = (item: any, t: LeaderboardType) => {
    switch (t) {
      case 'best-player':
        return formatPercentage(item.seasonROI);
      case 'top-winner':
        return `$${formatCents(item.totalProfit)}`;
      case 'best-performer':
        return item.seasonScore.toFixed(2);
      case 'most-action':
        return `$${formatCents(item.totalBuyIn)}`;
      case 'best-night':
        return item.bestSingleNight
          ? item.bestSingleNight.score.toFixed(2)
          : 'N/A';
      case 'biggest-table-take':
        return formatPercentage(item.bestTableShare);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Leaderboards - {activeSeason.name}</h2>

      <Tabs value={type} onValueChange={(v) => setType(v as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="best-player">Best Player</TabsTrigger>
          <TabsTrigger value="top-winner">Top Winner</TabsTrigger>
          <TabsTrigger value="best-performer">Performer</TabsTrigger>
          <TabsTrigger value="most-action">Most Action</TabsTrigger>
          <TabsTrigger value="best-night">Best Night</TabsTrigger>
          <TabsTrigger value="biggest-table-take">Table Take</TabsTrigger>
        </TabsList>

        <TabsContent value={type} className="mt-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p>Loading...</p>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                No players meet the eligibility threshold (minimum 3 nights played).
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((item, index) => (
                <Card key={item.playerId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{item.playerName}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {item.nightsPlayed} nights • ROI: {formatPercentage(item.seasonROI)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getIcon(type)}
                      <span className="font-bold text-lg">{getValue(item, type)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

