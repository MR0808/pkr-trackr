'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';
import { hashPassword, verifyPassword } from '@/lib/argon2';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export async function updateProfile(data: z.infer<typeof updateProfileSchema>) {
  const session = await requireAuth();
  const validated = updateProfileSchema.parse(data);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: `${validated.firstName} ${validated.lastName}`, // Keep name in sync
      firstName: validated.firstName,
      lastName: validated.lastName,
    },
  });

  return updated;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  const session = await requireAuth();
  const validated = changePasswordSchema.parse(data);

  // Get user's account to verify current password
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: 'credential',
    },
  });

  if (!account || !account.password) {
    throw new Error('No password account found');
  }

  // Verify current password
  const isValid = await verifyPassword(validated.currentPassword, account.password);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash and update password
  const hashedPassword = await hashPassword(validated.newPassword);
  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function getUserProfile() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

