'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';

export async function completeOnboarding() {
  const session = await requireAuth();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
    },
  });

  return { success: true };
}

export async function checkOnboardingStatus() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompletedAt: true,
      leagueMembers: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  const needsOnboarding = !user?.onboardingCompletedAt || user.leagueMembers.length === 0;

  return {
    needsOnboarding,
    completedAt: user?.onboardingCompletedAt,
  };
}

