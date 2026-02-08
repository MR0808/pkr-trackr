import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Admin section is protected by a single shared password.
 * Set in .env: ADMIN_PASSWORD (required), ADMIN_SESSION_SECRET (optional, default "admin-ok").
 */
const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/** Get the stored admin session token from cookies (server-only). */
export async function getAdminSession(): Promise<boolean> {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return false;
    // Token is a simple secret; must match what we set
    const expected = process.env.ADMIN_SESSION_SECRET ?? 'admin-ok';
    return token === expected;
}

/** Set admin session cookie (call after password verified). */
export async function setAdminCookie(): Promise<void> {
    const store = await cookies();
    const secret = process.env.ADMIN_SESSION_SECRET ?? 'admin-ok';
    store.set(ADMIN_COOKIE_NAME, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ADMIN_COOKIE_MAX_AGE,
        path: '/'
    });
}

/** Clear admin session cookie (logout). */
export async function clearAdminCookie(): Promise<void> {
    const store = await cookies();
    store.delete(ADMIN_COOKIE_NAME);
}

/** Verify admin password against env ADMIN_PASSWORD. Uses timing-safe compare. */
export function verifyAdminPassword(password: string): boolean {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || !password) return false;
    if (password.length !== expected.length) return false;
    const a = Buffer.from(password, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}
