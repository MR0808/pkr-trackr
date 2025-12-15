'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { updateUserAdmin, deleteUser, deleteLeague } from '@/src/server/actions/adminActions';
import { formatCents } from '@/src/server/metrics/pokerMetrics';
import { Users, Trophy, Calendar, Moon, DollarSign, Trash2, Shield, ShieldOff } from 'lucide-react';

interface AdminDashboardProps {
  stats: {
    users: number;
    leagues: number;
    seasons: number;
    nights: number;
    entries: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    emailVerified: boolean;
    createdAt: Date;
    _count: {
      leagueMembers: number;
      players: number;
    };
  }>;
  leagues: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    _count: {
      members: number;
      seasons: number;
    };
    members: Array<{
      user: {
        id: string;
        name: string;
        email: string;
      } | null;
    }>;
  }>;
}

export function AdminDashboard({ stats, users, leagues }: AdminDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin access?`)) {
      return;
    }

    setLoading(userId);
    try {
      await updateUserAdmin({ userId, isAdmin: !currentStatus });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update admin status');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(userId);
    try {
      await deleteUser({ userId });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteLeague = async (leagueId: string, leagueName: string) => {
    if (!confirm(`Are you sure you want to delete league "${leagueName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(leagueId);
    try {
      await deleteLeague({ leagueId });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete league');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">System Overview</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage all users, leagues, and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</p>
              <p className="text-3xl font-bold">{stats.users}</p>
            </div>
            <Users className="w-8 h-8 text-zinc-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Leagues</p>
              <p className="text-3xl font-bold">{stats.leagues}</p>
            </div>
            <Trophy className="w-8 h-8 text-zinc-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Nights</p>
              <p className="text-3xl font-bold">{stats.nights}</p>
            </div>
            <Moon className="w-8 h-8 text-zinc-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Volume</p>
              <p className="text-3xl font-bold">${formatCents(stats.totalBuyInCents)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-zinc-400" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="leagues">Leagues ({leagues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leagues</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.isAdmin && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {user.emailVerified && (
                          <Badge variant="outline">Verified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user._count.leagueMembers}</TableCell>
                    <TableCell>{user._count.players}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                          disabled={loading === user.id}
                        >
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-1" />
                              Make Admin
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={loading === user.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="leagues" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Seasons</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell className="font-medium">{league.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {league.description || '-'}
                    </TableCell>
                    <TableCell>
                      {league.members[0]?.user?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{league._count.members}</TableCell>
                    <TableCell>{league._count.seasons}</TableCell>
                    <TableCell>
                      {new Date(league.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a href={`/leagues/${league.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLeague(league.id, league.name)}
                          disabled={loading === league.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

