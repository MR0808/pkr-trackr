'use client';

import { useState } from 'react';
import { inviteMember } from '@/src/server/actions/leagueActions';
import { createSeason } from '@/src/server/actions/seasonActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserFullName } from '@/src/lib/user';
import { Mail, UserPlus } from 'lucide-react';

interface SettingsTabProps {
  league: {
    id: string;
    name: string;
    description: string | null;
    members: Array<{
      id: string;
      email: string;
      status: string;
      role: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
    }>;
  };
}

export function SettingsTab({ league }: SettingsTabProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [seasonName, setSeasonName] = useState('');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const result = await inviteMember({
        leagueId: league.id,
        email: inviteEmail,
      });
      setInviteSuccess(
        `Invite sent! Share this link: ${window.location.origin}/invite/${result.token}`
      );
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeasonError('');
    setSeasonLoading(true);

    try {
      await createSeason({
        leagueId: league.id,
        name: seasonName,
        startDate: new Date(seasonStartDate),
        endDate: seasonEndDate ? new Date(seasonEndDate) : undefined,
      });
      setSeasonName('');
      setSeasonStartDate('');
      setSeasonEndDate('');
      window.location.reload();
    } catch (err) {
      setSeasonError(err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      setSeasonLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Members</h2>
        <div className="space-y-2 mb-4">
          {league.members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {member.user ? getUserFullName(member.user) : member.email}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {member.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Member
          </h3>
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
                {inviteSuccess}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={inviteLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={inviteLoading}>
                <Mail className="w-4 h-4 mr-2" />
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Create Season</h2>
        <Card className="p-6">
          <form onSubmit={handleCreateSeason} className="space-y-4">
            {seasonError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {seasonError}
              </div>
            )}
            <div>
              <label htmlFor="seasonName" className="block text-sm font-medium mb-1">
                Season Name *
              </label>
              <Input
                id="seasonName"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                required
                disabled={seasonLoading}
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="seasonStartDate" className="block text-sm font-medium mb-1">
                Start Date *
              </label>
              <Input
                id="seasonStartDate"
                type="date"
                value={seasonStartDate}
                onChange={(e) => setSeasonStartDate(e.target.value)}
                required
                disabled={seasonLoading}
              />
            </div>
            <div>
              <label htmlFor="seasonEndDate" className="block text-sm font-medium mb-1">
                End Date (optional)
              </label>
              <Input
                id="seasonEndDate"
                type="date"
                value={seasonEndDate}
                onChange={(e) => setSeasonEndDate(e.target.value)}
                disabled={seasonLoading}
              />
            </div>
            <Button type="submit" disabled={seasonLoading}>
              {seasonLoading ? 'Creating...' : 'Create Season'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

