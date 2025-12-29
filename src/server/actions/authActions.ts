'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '../auth/getSession';
import { hashPassword } from '@/lib/argon2';

const signupSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signupWithName(data: z.infer<typeof signupSchema>) {
  const validated = signupSchema.parse(data);

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Create user with firstName and lastName
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const hashedPassword = await hashPassword(validated.password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name: `${validated.firstName} ${validated.lastName}`, // Better Auth requires name
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      emailVerified: false,
    },
  });

  // Create account for Better Auth
  await prisma.account.create({
    data: {
      id: `account-${userId}`,
      accountId: validated.email,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
    },
  });

  return { user };
}

const updateUserNameSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export async function updateUserName(data: z.infer<typeof updateUserNameSchema>) {
  const session = await requireAuth();
  const validated = updateUserNameSchema.parse(data);

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

