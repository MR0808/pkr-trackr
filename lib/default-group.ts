import { prisma } from '@/lib/prisma';

/**
 * Single source of truth for the default group (one group for the whole site).
 * Set DEFAULT_GROUP_ID in .env to fix the group; otherwise the first group in the DB is used.
 */
export async function getDefaultGroupId(): Promise<string> {
    const id = process.env.DEFAULT_GROUP_ID?.trim();
    if (id) return id;
    const group = await prisma.group.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!group) throw new Error('No group found. Set DEFAULT_GROUP_ID in .env or create a group.');
    return group.id;
}
