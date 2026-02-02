import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { Gender } from '@/generated/prisma/client';
import { customSession, openAPI } from 'better-auth/plugins';
import { error } from 'console';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/argon2';
// import { sendVerificationEmail, sendResetEmail } from '@/lib/mail';

const options = {
    database: prismaAdapter(prisma, {
        provider: 'postgresql' // or "mysql", "postgresql", ...etc
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
        }
    },
    emailAndPassword: {
        enabled: true,
        password: {
            hash: hashPassword,
            verify: verifyPassword
        },
        autoSignIn: true,
        requireEmailVerification: false,
        sendResetPassword: async ({ user, url }) => {
            //   await sendResetEmail({
            //     email: user.email,
            //     link: url,
            //     name: user.name
            //   });
            console.log('sendResetPassword', user, url);
        }
    },
    advanced: {
        database: {
            generateId: false
        }
    },
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async (
                { user, newEmail, url, token },
                request
            ) => {
                // await sendVerificationEmail({
                //   email: newEmail,
                //   otp: token,
                //   name: user.name
                // });
                console.log(
                    'sendChangeEmailVerification',
                    user,
                    newEmail,
                    url,
                    token
                );
            }
        },
        additionalFields: {
            firstName: {
                type: 'string',
                required: true
            },
            lastName: {
                type: 'string',
                required: true
            },
            gender: {
                type: ['MALE', 'FEMALE', 'OTHER', 'NOTSAY'] as Array<Gender>,
                required: false
            },
            dateOfBirth: {
                type: 'date',
                required: false
            },
            countryId: {
                type: 'string',
                required: false
            },
            regionId: {
                type: 'string',
                required: false
            },
            phoneNumber: {
                type: 'string',
                required: false
            },
            phoneVerified: {
                type: 'boolean',
                required: false
            },
            emailVerified: {
                type: 'boolean',
                required: false
            },
            emailVerifiedAt: {
                type: 'date',
                required: false
            },
            bio: {
                type: 'string',
                required: false
            }
        }
    },
    session: {
        expiresIn: 30 * 24 * 60 * 60,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    account: {
        accountLinking: {
            enabled: false
        }
    },
    plugins: [nextCookies()]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
    ...options,
    plugins: [
        ...(options.plugins ?? []),
        customSession(async ({ user, session }, ctx) => {
            return {
                session,
                user
            };
        }, options),
        openAPI()
    ]
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | 'UNKNOWN';
