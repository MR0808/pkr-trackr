import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, customSession, openAPI } from 'better-auth/plugins';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/argon2';
import { error } from 'console';

const options = {
    database: prismaAdapter(prisma, {
        provider: 'postgresql' // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        password: {
            hash: hashPassword,
            verify: verifyPassword
        }
    },
    advanced: {
        database: {
            generateId: false
        }
    },
    session: {
        expiresIn: 30 * 24 * 60 * 60,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    plugins: [nextCookies()]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
    ...options,
    plugins: [...(options.plugins ?? []), openAPI()]
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | 'UNKNOWN';
