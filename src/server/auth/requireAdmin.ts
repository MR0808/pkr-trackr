import { requireAuth } from './getSession';
import { prisma } from '@/lib/prisma';

export async function requireAdmin() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return session;
}

