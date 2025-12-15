import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  // Enrich session with isAdmin field
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });
    if (user) {
      return {
        ...session,
        user: {
          ...session.user,
          isAdmin: user.isAdmin,
        },
      };
    }
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

