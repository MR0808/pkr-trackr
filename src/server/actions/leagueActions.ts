'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';
import { randomBytes } from 'crypto';

const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const inviteMemberSchema = z.object({
  leagueId: z.string().uuid(),
  email: z.string().email(),
});

const acceptInviteSchema = z.object({
  token: z.string(),
});

const updateMemberRoleSchema = z.object({
  leagueId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

const revokeInviteSchema = z.object({
  leagueId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export async function createLeague(data: z.infer<typeof createLeagueSchema>) {
  const session = await requireAuth();
  const validated = createLeagueSchema.parse(data);

  const league = await prisma.league.create({
    data: {
      name: validated.name,
      description: validated.description,
      members: {
        create: {
          userId: session.user.id,
          email: session.user.email,
          status: 'ACTIVE',
          role: 'OWNER',
          joinedAt: new Date(),
        },
      },
    },
    include: {
      members: true,
    },
  });

  return league;
}

export async function inviteMember(data: z.infer<typeof inviteMemberSchema>) {
  const session = await requireAuth();
  const validated = inviteMemberSchema.parse(data);

  // Check if user has permission (OWNER or ADMIN)
  const member = await prisma.leagueMember.findFirst({
    where: {
      leagueId: validated.leagueId,
      userId: session.user.id,
      status: 'ACTIVE',
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!member) {
    throw new Error('Unauthorized: Only owners and admins can invite members');
  }

  // Check if member already exists
  const existing = await prisma.leagueMember.findUnique({
    where: {
      leagueId_email: {
        leagueId: validated.leagueId,
        email: validated.email,
      },
    },
  });

  if (existing) {
    throw new Error('Member already exists or has been invited');
  }

  // Generate invite token (store directly, single-use and time-limited)
  const token = randomBytes(32).toString('hex');

  const leagueMember = await prisma.leagueMember.create({
    data: {
      leagueId: validated.leagueId,
      email: validated.email,
      status: 'PENDING',
      role: 'MEMBER',
      inviteToken: token,
      invitedAt: new Date(),
    },
  });

  // Return the token for email sending (in production, send email here)
  return {
    member: leagueMember,
    token, // This should be sent via email in production
  };
}

export async function acceptInvite(data: z.infer<typeof acceptInviteSchema>) {
  const session = await requireAuth();
  const validated = acceptInviteSchema.parse(data);

  const member = await prisma.leagueMember.findFirst({
    where: {
      inviteToken: validated.token,
      status: 'PENDING',
    },
    include: {
      league: true,
    },
  });

  if (!member) {
    throw new Error('Invalid or expired invite token');
  }

  // Verify email matches
  if (member.email !== session.user.email) {
    throw new Error('Invite email does not match your account email');
  }

  const updated = await prisma.leagueMember.update({
    where: {
      id: member.id,
    },
    data: {
      userId: session.user.id,
      status: 'ACTIVE',
      joinedAt: new Date(),
      inviteToken: null,
    },
  });

  return updated;
}

export async function updateMemberRole(
  data: z.infer<typeof updateMemberRoleSchema>
) {
  const session = await requireAuth();
  const validated = updateMemberRoleSchema.parse(data);

  // Check if user is OWNER
  const requester = await prisma.leagueMember.findFirst({
    where: {
      leagueId: validated.leagueId,
      userId: session.user.id,
      status: 'ACTIVE',
      role: 'OWNER',
    },
  });

  if (!requester) {
    throw new Error('Unauthorized: Only owners can update roles');
  }

  // Prevent removing last OWNER
  if (validated.role !== 'OWNER') {
    const targetMember = await prisma.leagueMember.findUnique({
      where: { id: validated.memberId },
    });

    if (targetMember?.role === 'OWNER') {
      const ownerCount = await prisma.leagueMember.count({
        where: {
          leagueId: validated.leagueId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner');
      }
    }
  }

  const updated = await prisma.leagueMember.update({
    where: {
      id: validated.memberId,
    },
    data: {
      role: validated.role,
    },
  });

  return updated;
}

export async function revokeInvite(data: z.infer<typeof revokeInviteSchema>) {
  const session = await requireAuth();
  const validated = revokeInviteSchema.parse(data);

  // Check if user has permission
  const requester = await prisma.leagueMember.findFirst({
    where: {
      leagueId: validated.leagueId,
      userId: session.user.id,
      status: 'ACTIVE',
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!requester) {
    throw new Error('Unauthorized');
  }

  const member = await prisma.leagueMember.findUnique({
    where: { id: validated.memberId },
  });

  if (!member || member.leagueId !== validated.leagueId) {
    throw new Error('Member not found');
  }

  // Prevent removing last OWNER
  if (member.role === 'OWNER' && member.status === 'ACTIVE') {
    const ownerCount = await prisma.leagueMember.count({
      where: {
        leagueId: validated.leagueId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    if (ownerCount <= 1) {
      throw new Error('Cannot remove the last owner');
    }
  }

  const updated = await prisma.leagueMember.update({
    where: {
      id: validated.memberId,
    },
    data: {
      status: 'REVOKED',
    },
  });

  return updated;
}

export async function getLeagues() {
  const session = await requireAuth();

  const leagues = await prisma.league.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
      },
    },
    include: {
      members: {
        where: {
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      seasons: {
        where: {
          isActive: true,
        },
        orderBy: {
          startDate: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return leagues;
}

export async function getLeague(leagueId: string) {
  const session = await requireAuth();

  const league = await prisma.league.findFirst({
    where: {
      id: leagueId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { role: 'asc' },
          { joinedAt: 'desc' },
        ],
      },
      seasons: {
        orderBy: {
          startDate: 'desc',
        },
      },
    },
  });

  if (!league) {
    throw new Error('League not found or access denied');
  }

  return league;
}

