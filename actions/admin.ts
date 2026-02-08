'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDefaultGroupId } from '@/lib/default-group';
import {
    getAdminSession,
    setAdminCookie,
    clearAdminCookie,
    verifyAdminPassword
} from '@/lib/admin-auth';

async function requireAdmin() {
    const ok = await getAdminSession();
    if (!ok) redirect('/admin');
}

/** Verify password and set admin session cookie. */
export async function verifyAdminAction(password: string): Promise<{ success: boolean; error?: string }> {
    if (!password?.trim()) return { success: false, error: 'Password required' };
    if (!verifyAdminPassword(password.trim())) return { success: false, error: 'Invalid password' };
    await setAdminCookie();
    return { success: true };
}

/** Clear admin session (logout). */
export async function adminLogoutAction(): Promise<void> {
    await clearAdminCookie();
    revalidatePath('/admin');
    redirect('/admin');
}

// --- Seasons ---

export async function adminListSeasons(): Promise<
    { id: string; name: string; startsAt: Date; endsAt: Date | null; isLocked: boolean; gameCount: number }[]
> {
    await requireAdmin();
    const groupId = await getDefaultGroupId();
    const seasons = await prisma.season.findMany({
        where: { groupId },
        orderBy: { startsAt: 'desc' },
        include: { _count: { select: { games: true } } }
    });
    return seasons.map((s) => ({
        id: s.id,
        name: s.name,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        isLocked: s.isLocked,
        gameCount: s._count.games
    }));
}

export async function adminCreateSeasonAction(formData: {
    name: string;
    startsAt: string; // ISO date
    endsAt?: string | null;
}): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    const name = formData.name?.trim();
    if (!name) return { success: false, error: 'Name is required' };
    const startsAt = new Date(formData.startsAt);
    if (isNaN(startsAt.getTime())) return { success: false, error: 'Invalid start date' };
    const endsAt = formData.endsAt ? new Date(formData.endsAt) : null;
    if (endsAt != null && isNaN(endsAt.getTime())) return { success: false, error: 'Invalid end date' };
    try {
        const groupId = await getDefaultGroupId();
        await prisma.season.create({
            data: { groupId, name, startsAt, endsAt: endsAt ?? undefined }
        });
        revalidatePath('/admin');
        revalidatePath('/admin/seasons');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to create season' };
    }
}

export async function adminLockSeasonAction(seasonId: string): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await prisma.season.update({ where: { id: seasonId }, data: { isLocked: true } });
        revalidatePath('/admin');
        revalidatePath('/admin/seasons');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to lock season' };
    }
}

export async function adminUnlockSeasonAction(seasonId: string): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await prisma.season.update({ where: { id: seasonId }, data: { isLocked: false } });
        revalidatePath('/admin');
        revalidatePath('/admin/seasons');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to unlock season' };
    }
}

// --- Players ---

export async function adminListPlayers(): Promise<{ id: string; name: string; gameCount: number }[]> {
    await requireAdmin();
    const groupId = await getDefaultGroupId();
    const players = await prisma.player.findMany({
        where: { groupId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { games: true } } }
    });
    return players.map((p) => ({ id: p.id, name: p.name, gameCount: p._count.games }));
}

export async function adminCreatePlayerAction(name: string): Promise<{ success: boolean; error?: string; id?: string }> {
    await requireAdmin();
    const trimmed = name?.trim();
    if (!trimmed) return { success: false, error: 'Name is required' };
    try {
        const groupId = await getDefaultGroupId();
        const player = await prisma.player.create({ data: { groupId, name: trimmed } });
        revalidatePath('/admin');
        revalidatePath('/admin/players');
        return { success: true, id: player.id };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('Unique constraint') || msg.includes('P2002'))
            return { success: false, error: 'A player with that name already exists' };
        return { success: false, error: msg };
    }
}

export async function adminUpdatePlayerAction(
    playerId: string,
    name: string
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    const trimmed = name?.trim();
    if (!trimmed) return { success: false, error: 'Name is required' };
    try {
        await prisma.player.update({ where: { id: playerId }, data: { name: trimmed } });
        revalidatePath('/admin');
        revalidatePath('/admin/players');
        return { success: true };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('Unique constraint') || msg.includes('P2002'))
            return { success: false, error: 'A player with that name already exists' };
        return { success: false, error: msg };
    }
}

// --- Games ---

export type AdminGameRow = {
    id: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    scheduledAt: Date;
    closedAt: Date | null;
    seasonId: string | null;
    seasonName: string | null;
    playerCount: number;
};

export async function adminListGames(): Promise<AdminGameRow[]> {
    await requireAdmin();
    const groupId = await getDefaultGroupId();
    const games = await prisma.game.findMany({
        where: { groupId },
        orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
        take: 200,
        select: {
            id: true,
            name: true,
            status: true,
            scheduledAt: true,
            closedAt: true,
            seasonId: true,
            season: { select: { name: true } },
            _count: { select: { players: true } }
        }
    });
    return games.map((g) => ({
        id: g.id,
        name: g.name,
        status: g.status,
        scheduledAt: g.scheduledAt,
        closedAt: g.closedAt,
        seasonId: g.seasonId,
        seasonName: g.season?.name ?? null,
        playerCount: g._count.players
    }));
}

export async function adminCreateGameAction(formData: {
    name: string;
    scheduledAt: string; // ISO date/datetime
    seasonId?: string | null;
}): Promise<{ success: boolean; error?: string; gameId?: string }> {
    await requireAdmin();
    const name = formData.name?.trim();
    if (!name) return { success: false, error: 'Game name is required' };
    const scheduledAt = new Date(formData.scheduledAt);
    if (isNaN(scheduledAt.getTime())) return { success: false, error: 'Invalid date' };
    try {
        const groupId = await getDefaultGroupId();
        const { nanoid } = await import('nanoid');
        const game = await prisma.game.create({
            data: {
                groupId,
                name,
                scheduledAt,
                seasonId: formData.seasonId && formData.seasonId.trim() ? formData.seasonId : undefined,
                shareId: nanoid(16)
            }
        });
        revalidatePath('/admin');
        revalidatePath('/admin/games');
        return { success: true, gameId: game.id };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to create game' };
    }
}

export async function adminUpdateGameAction(formData: {
    gameId: string;
    name?: string;
    scheduledAt?: string;
    seasonId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    const { gameId, name, scheduledAt, seasonId } = formData;
    if (!gameId) return { success: false, error: 'Game ID required' };
    const data: { name?: string; scheduledAt?: Date; seasonId?: string | null } = {};
    if (name !== undefined) data.name = name.trim() || undefined;
    if (scheduledAt !== undefined) {
        const d = new Date(scheduledAt);
        if (!isNaN(d.getTime())) data.scheduledAt = d;
    }
    if (seasonId !== undefined) data.seasonId = seasonId && seasonId.trim() ? seasonId : null;
    if (Object.keys(data).length === 0) return { success: true };
    try {
        await prisma.game.update({ where: { id: gameId }, data });
        revalidatePath('/admin');
        revalidatePath('/admin/games');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to update game' };
    }
}

// --- Game edit (buy-ins, cash-out, adjustments) ---

export type AdminGamePlayerRow = {
    gamePlayerId: string;
    playerId: string;
    playerName: string;
    buyInCents: number;
    cashOutCents: number | null;
    adjustmentCents: number;
};

export async function adminGetGameForEdit(
    gameId: string
): Promise<
    | { game: { id: string; name: string; status: string }; players: AdminGamePlayerRow[] }
    | null
> {
    await requireAdmin();
    const groupId = await getDefaultGroupId();
    const game = await prisma.game.findFirst({
        where: { id: gameId, groupId },
        select: {
            id: true,
            name: true,
            status: true,
            players: {
                select: {
                    id: true,
                    playerId: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true,
                    player: { select: { name: true } }
                }
            }
        }
    });
    if (!game) return null;
    return {
        game: {
            id: game.id,
            name: game.name,
            status: game.status
        },
        players: game.players.map((gp) => ({
            gamePlayerId: gp.id,
            playerId: gp.playerId,
            playerName: gp.player.name,
            buyInCents: gp.buyInCents,
            cashOutCents: gp.cashOutCents,
            adjustmentCents: gp.adjustmentCents
        }))
    };
}

export async function adminUpdateGamePlayerAmounts(
    gameId: string,
    updates: { gamePlayerId: string; buyInCents: number; cashOutCents: number | null; adjustmentCents: number }[]
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    const groupId = await getDefaultGroupId();
    const game = await prisma.game.findFirst({
        where: { id: gameId, groupId },
        select: { id: true }
    });
    if (!game) return { success: false, error: 'Game not found' };
    try {
        for (const u of updates) {
            await prisma.gamePlayer.updateMany({
                where: { id: u.gamePlayerId, gameId },
                data: {
                    buyInCents: u.buyInCents,
                    cashOutCents: u.cashOutCents,
                    adjustmentCents: u.adjustmentCents
                }
            });
        }
        revalidatePath('/admin');
        revalidatePath('/admin/games');
        revalidatePath(`/admin/games/${gameId}`);
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to update amounts' };
    }
}
