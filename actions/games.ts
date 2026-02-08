'use server';

import { prisma } from '@/lib/prisma';

export type GameListRow = {
    id: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    scheduledAt: Date;
    startedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;

    playerCount: number;
    totalBuyInCents: number;
    totalCashOutCents: number;
    deltaCents: number; // buyins - cashouts
};

export type GameResultRow = {
    playerName: string;
    buyInCents: number;
    cashOutCents: number | null;
    profitCents: number;
    /** Night score: ROI × √(buy-in $), same as stats. */
    nightScore: number;
};

export type GameListRowWithResults = GameListRow & {
    seasonId: string | null;
    results: GameResultRow[];
};

export type GamesListPageData = {
    games: GameListRowWithResults[];
    seasons: { id: string; name: string }[];
};

export async function loadGamesForGroup(opts: {
    groupId: string;
    seasonId?: string;
    status?: 'OPEN' | 'CLOSED';
    take?: number;
    skip?: number;
}): Promise<GameListRow[]> {
    const { groupId, seasonId, status, take = 50, skip = 0 } = opts;

    if (!groupId) throw new Error('groupId is required');

    // 1) Fetch games (display fields + ordering)
    const games = await prisma.game.findMany({
        where: {
            groupId,
            ...(seasonId ? { seasonId } : {}),
            ...(status ? { status } : {})
        },
        orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        select: {
            id: true,
            name: true,
            status: true,
            scheduledAt: true,
            startedAt: true,
            closedAt: true,
            createdAt: true
        }
    });

    if (games.length === 0) return [];

    const gameIds = games.map((g) => g.id);

    // 2) Aggregate GamePlayer per game
    const aggregates = await prisma.gamePlayer.groupBy({
        by: ['gameId'],
        where: { gameId: { in: gameIds } },
        _count: { _all: true },
        _sum: {
            buyInCents: true,
            cashOutCents: true
        }
    });

    // Map: gameId -> aggregates
    const aggByGameId = new Map<
        string,
        {
            playerCount: number;
            totalBuyInCents: number;
            totalCashOutCents: number;
        }
    >();

    for (const a of aggregates) {
        aggByGameId.set(a.gameId, {
            playerCount: a._count._all ?? 0,
            totalBuyInCents: a._sum.buyInCents ?? 0,
            // Prisma sums ignore null; if all cashOutCents are null, _sum.cashOutCents will be null
            totalCashOutCents: a._sum.cashOutCents ?? 0
        });
    }

    // 3) Merge + compute delta
    return games.map((g) => {
        const agg = aggByGameId.get(g.id) ?? {
            playerCount: 0,
            totalBuyInCents: 0,
            totalCashOutCents: 0
        };

        const deltaCents = agg.totalBuyInCents - agg.totalCashOutCents;

        return {
            id: g.id,
            name: g.name,
            status: g.status,
            scheduledAt: g.scheduledAt,
            startedAt: g.startedAt,
            closedAt: g.closedAt,
            createdAt: g.createdAt,

            playerCount: agg.playerCount,
            totalBuyInCents: agg.totalBuyInCents,
            totalCashOutCents: agg.totalCashOutCents,
            deltaCents
        };
    });
}

const GAMES_LIST_TAKE = 500;

export async function loadGamesListPageData(opts: {
    groupId: string;
}): Promise<GamesListPageData> {
    const { groupId } = opts;
    if (!groupId) throw new Error('groupId is required');

    const [seasons, games] = await Promise.all([
        prisma.season.findMany({
            where: { groupId },
            orderBy: { startsAt: 'desc' },
            select: { id: true, name: true }
        }),
        prisma.game.findMany({
            where: { groupId },
            orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
            take: GAMES_LIST_TAKE,
            select: {
                id: true,
                name: true,
                status: true,
                scheduledAt: true,
                startedAt: true,
                closedAt: true,
                createdAt: true,
                seasonId: true,
                season: { select: { id: true, name: true } },
                players: {
                    select: {
                        buyInCents: true,
                        cashOutCents: true,
                        adjustmentCents: true,
                        player: { select: { name: true } }
                    }
                }
            }
        })
    ]);

    function nightScore(profitCents: number, buyInCents: number): number {
        if (buyInCents <= 0) return 0;
        const buyInDollars = buyInCents / 100;
        const profitDollars = profitCents / 100;
        const roi = profitDollars / buyInDollars;
        return roi * Math.sqrt(buyInDollars);
    }

    const gamesWithResults: GameListRowWithResults[] = games.map((g) => {
        let totalBuyInCents = 0;
        let totalCashOutCents = 0;
        const results: GameResultRow[] = g.players.map((gp) => {
            const buyInCents = gp.buyInCents;
            const cashOutCents = gp.cashOutCents;
            const profitCents =
                (cashOutCents ?? 0) - buyInCents - gp.adjustmentCents;
            totalBuyInCents += buyInCents;
            totalCashOutCents += cashOutCents ?? 0;
            const score = nightScore(profitCents, buyInCents);
            return {
                playerName: gp.player.name,
                buyInCents,
                cashOutCents,
                profitCents,
                nightScore: score
            };
        });
        results.sort((a, b) => b.nightScore - a.nightScore);
        const deltaCents = totalBuyInCents - totalCashOutCents;
        return {
            id: g.id,
            name: g.name,
            status: g.status,
            scheduledAt: g.scheduledAt,
            startedAt: g.startedAt,
            closedAt: g.closedAt,
            createdAt: g.createdAt,
            playerCount: g.players.length,
            totalBuyInCents,
            totalCashOutCents,
            deltaCents,
            seasonId: g.seasonId,
            results
        };
    });

    return {
        games: gamesWithResults,
        seasons: seasons.map((s) => ({ id: s.id, name: s.name }))
    };
}

// Load a single game with players and synthesized transactions, converting cents -> dollars
import type {
    Game as GameView,
    Transaction as Txn,
    GameTotals
} from '@/types/games';

export async function loadGameByShareId(shareId: string): Promise<{
    game: GameView | null;
    totals: GameTotals | null;
    shareId: string | null;
}> {
    if (!shareId) throw new Error('shareId is required');
    const game = await prisma.game.findUnique({ where: { shareId } });
    if (!game) return { game: null, totals: null, shareId: null };
    return loadGame(game.id);
}

export async function loadGame(gameId: string): Promise<{
    game: GameView | null;
    totals: GameTotals | null;
    shareId: string | null;
}> {
    if (!gameId) throw new Error('gameId is required');

    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
            players: {
                include: { player: true }
            }
        }
    });

    if (!game) return { game: null, totals: null, shareId: null };

    // Map GamePlayer -> Player (UI-friendly numbers: dollars)
    // net = result = cashout - buyin (positive = won, negative = lost)
    const players = game.players.map((gp) => {
        const buyInsTotal = Math.round(gp.buyInCents / 100);
        const cashout =
            gp.cashOutCents === null ? null : Math.round(gp.cashOutCents / 100);
        const adjustmentsTotal = Math.round(gp.adjustmentCents / 100);
        const net = (cashout ?? 0) - buyInsTotal - adjustmentsTotal;

        return {
            id: gp.player.id,
            name: gp.player.name,
            buyInsTotal,
            cashout,
            adjustmentsTotal,
            net
        };
    });

    // Synthesize transactions from per-player aggregates (one entry per type)
    const transactions: Txn[] = [];

    for (const gp of game.players) {
        const playerName = gp.player.name;
        const buyInsAmount = Math.round(gp.buyInCents / 100);
        const adjustmentsAmount = Math.round(gp.adjustmentCents / 100);
        const cashoutAmount =
            gp.cashOutCents === null ? null : Math.round(gp.cashOutCents / 100);

        const timestamp = gp.updatedAt || gp.createdAt;

        if (buyInsAmount > 0) {
            transactions.push({
                id: `gp-${gp.id}-buyin`,
                playerId: gp.playerId,
                playerName,
                type: 'BUY_IN',
                amount: buyInsAmount,
                timestamp
            });
        }

        if (adjustmentsAmount !== 0) {
            transactions.push({
                id: `gp-${gp.id}-adjust`,
                playerId: gp.playerId,
                playerName,
                type: 'ADJUSTMENT',
                amount: adjustmentsAmount,
                timestamp
            });
        }

        if (cashoutAmount !== null) {
            transactions.push({
                id: `gp-${gp.id}-cashout`,
                playerId: gp.playerId,
                playerName,
                type: 'CASHOUT',
                amount: cashoutAmount,
                timestamp
            });
        }
    }

    // sort by timestamp desc
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const totalIn = players.reduce((sum, p) => sum + p.buyInsTotal, 0);
    const totalOut = players.reduce((sum, p) => sum + (p.cashout || 0), 0);
    const totals: GameTotals = {
        totalIn,
        totalOut,
        bankDelta: totalIn - totalOut
    };

    const result: GameView = {
        id: game.id,
        name: game.name,
        status: game.status,
        createdAt: game.createdAt,
        closedAt: game.closedAt,
        scheduledAt: game.scheduledAt,
        players,
        transactions
    };

    return { game: result, totals, shareId: game.shareId };
}

import {
    createGameSchema,
    type CreateGameInput,
    addPlayerSchema,
    type AddPlayerInput,
    buyInSchema,
    type BuyInInput,
    cashoutSchema,
    type CashoutInput,
    adjustmentSchema,
    type AdjustmentInput,
    undoTransactionSchema,
    type UndoTransactionInput,
    closeGameSchema,
    type CloseGameInput
} from '@/schemas/games';
import { getDefaultGroupId } from '@/lib/default-group';

export async function createGameAction(
    input: CreateGameInput
): Promise<{ success: boolean; error?: string; gameId?: string }> {
    try {
        const data = createGameSchema.parse(input);
        const groupId = await getDefaultGroupId();
        const { nanoid } = await import('nanoid');
        const game = await prisma.game.create({
            data: {
                groupId,
                name: data.name.trim(),
                status: 'OPEN',
                scheduledAt: data.date,
                shareId: nanoid(16)
            }
        });
        return { success: true, gameId: game.id };
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
            const zod = err as { errors: { message: string }[] };
            return { success: false, error: zod.errors[0]?.message ?? 'Validation failed' };
        }
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

export async function addPlayerAction(input: AddPlayerInput): Promise<{
    success: boolean;
    error?: string;
    playerId?: string;
    wasCreated?: boolean;
    alreadyInGame?: boolean;
}> {
    try {
        const data = addPlayerSchema.parse(input);

        // 1) Fetch game + ensure it's open
        const game = await prisma.game.findUnique({
            where: { id: data.gameId },
            select: { id: true, status: true, groupId: true }
        });

        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        // 2) In a transaction, find or create player (case-insensitive match), then add to game
        const result = await prisma.$transaction(async (tx) => {
            // Try case-insensitive match to avoid dupes
            let player = await tx.player.findFirst({
                where: {
                    groupId: game.groupId,
                    name: {
                        equals: data.name.trim(),
                        mode: 'insensitive' as const
                    }
                }
            });

            let wasCreated = false;

            if (!player) {
                try {
                    player = await tx.player.create({
                        data: { groupId: game.groupId, name: data.name.trim() }
                    });
                    wasCreated = true;
                } catch (err: any) {
                    // Unique race: another request created it. Re-fetch.
                    if (err?.code === 'P2002') {
                        player = await tx.player.findFirst({
                            where: {
                                groupId: game.groupId,
                                name: {
                                    equals: data.name.trim(),
                                    mode: 'insensitive' as const
                                }
                            }
                        });
                    } else {
                        throw err;
                    }
                }
            }

            if (!player) throw new Error('Failed to resolve player');

            // Check if already in game
            const existingGP = await tx.gamePlayer.findFirst({
                where: { gameId: data.gameId, playerId: player.id }
            });

            if (existingGP) {
                return { playerId: player.id, wasCreated, alreadyInGame: true };
            }

            await tx.gamePlayer.create({
                data: { gameId: data.gameId, playerId: player.id }
            });

            return { playerId: player.id, wasCreated, alreadyInGame: false };
        });

        return { success: true, ...result };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length) {
            return { success: false, error: err.errors[0].message };
        }

        return { success: false, error: err?.message || String(err) };
    }
}

export async function addBuyInAction(input: BuyInInput): Promise<{
    success: boolean;
    error?: string;
    playerId?: string;
    player?: {
        id: string;
        name: string;
        buyInsTotal: number;
        cashout: number | null;
        adjustmentsTotal: number;
        net: number;
    };
}> {
    try {
        const data = buyInSchema.parse(input);
        const { gameId, playerId, amount } = data;
        const amountCents = Math.round(amount * 100);

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true, seasonId: true }
        });
        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        const result = await prisma.$transaction(async (tx) => {
            const gp = await tx.gamePlayer.findFirst({
                where: { gameId, playerId },
                select: {
                    id: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true,
                    player: { select: { id: true, name: true } }
                }
            });

            if (!gp) throw new Error('Player not in game');

            await tx.gamePlayer.update({
                where: { id: gp.id },
                data: { buyInCents: { increment: amountCents } }
            });

            if (game.seasonId) {
                await tx.seasonPlayerStats.upsert({
                    where: {
                        seasonId_playerId: { seasonId: game.seasonId, playerId }
                    },
                    update: { totalBuyInCents: { increment: amountCents } },
                    create: {
                        seasonId: game.seasonId,
                        playerId,
                        totalBuyInCents: amountCents,
                        totalCashOutCents: 0,
                        totalProfitCents: 0,
                        totalGames: 0
                    }
                });
            }

            const gpFinal = await tx.gamePlayer.findUnique({
                where: { id: gp.id },
                include: { player: true }
            });

            const buyInsTotal = Math.round(gpFinal!.buyInCents / 100);
            const cashout =
                gpFinal!.cashOutCents === null
                    ? null
                    : Math.round(gpFinal!.cashOutCents / 100);
            const adjustmentsTotal = Math.round(gpFinal!.adjustmentCents / 100);
            const net = (cashout ?? 0) - buyInsTotal - adjustmentsTotal;

            return {
                playerId,
                player: {
                    id: gpFinal!.player.id,
                    name: gpFinal!.player.name,
                    buyInsTotal,
                    cashout,
                    adjustmentsTotal,
                    net
                }
            };
        });

        return { success: true, ...result };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length)
            return { success: false, error: err.errors[0].message };
        return { success: false, error: err?.message || String(err) };
    }
}

export async function setCashoutAction(input: CashoutInput): Promise<{
    success: boolean;
    error?: string;
    playerId?: string;
    player?: {
        id: string;
        name: string;
        buyInsTotal: number;
        cashout: number | null;
        adjustmentsTotal: number;
        net: number;
    };
}> {
    try {
        const data = cashoutSchema.parse(input);
        const { gameId, playerId, amount } = data;
        const amountCents = Math.round(amount * 100);

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true }
        });
        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        const result = await prisma.$transaction(async (tx) => {
            const gp = await tx.gamePlayer.findFirst({
                where: { gameId, playerId },
                select: {
                    id: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true,
                    player: { select: { id: true, name: true } }
                }
            });

            if (!gp) throw new Error('Player not in game');

            await tx.gamePlayer.update({
                where: { id: gp.id },
                data: { cashOutCents: amountCents }
            });

            const gpFinal = await tx.gamePlayer.findUnique({
                where: { id: gp.id },
                include: { player: true }
            });

            const buyInsTotal = Math.round(gpFinal!.buyInCents / 100);
            const cashout =
                gpFinal!.cashOutCents === null
                    ? null
                    : Math.round(gpFinal!.cashOutCents / 100);
            const adjustmentsTotal = Math.round(gpFinal!.adjustmentCents / 100);
            const net = (cashout ?? 0) - buyInsTotal - adjustmentsTotal;

            return {
                playerId,
                player: {
                    id: gpFinal!.player.id,
                    name: gpFinal!.player.name,
                    buyInsTotal,
                    cashout,
                    adjustmentsTotal,
                    net
                }
            };
        });

        return { success: true, ...result };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length)
            return { success: false, error: err.errors[0].message };
        return { success: false, error: err?.message || String(err) };
    }
}

export async function addAdjustmentAction(input: AdjustmentInput): Promise<{
    success: boolean;
    error?: string;
    playerId?: string;
    player?: {
        id: string;
        name: string;
        buyInsTotal: number;
        cashout: number | null;
        adjustmentsTotal: number;
        net: number;
    };
}> {
    try {
        const data = adjustmentSchema.parse(input);
        const { gameId, playerId, amount } = data;
        const amountCents = Math.round(amount * 100);

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true }
        });
        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        const result = await prisma.$transaction(async (tx) => {
            const gp = await tx.gamePlayer.findFirst({
                where: { gameId, playerId },
                select: {
                    id: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true,
                    player: { select: { id: true, name: true } }
                }
            });

            if (!gp) throw new Error('Player not in game');

            await tx.gamePlayer.update({
                where: { id: gp.id },
                data: { adjustmentCents: { increment: amountCents } }
            });

            const gpFinal = await tx.gamePlayer.findUnique({
                where: { id: gp.id },
                include: { player: true }
            });

            const buyInsTotal = Math.round(gpFinal!.buyInCents / 100);
            const cashout =
                gpFinal!.cashOutCents === null
                    ? null
                    : Math.round(gpFinal!.cashOutCents / 100);
            const adjustmentsTotal = Math.round(gpFinal!.adjustmentCents / 100);
            const net = (cashout ?? 0) - buyInsTotal - adjustmentsTotal;

            return {
                playerId,
                player: {
                    id: gpFinal!.player.id,
                    name: gpFinal!.player.name,
                    buyInsTotal,
                    cashout,
                    adjustmentsTotal,
                    net
                }
            };
        });

        return { success: true, ...result };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length)
            return { success: false, error: err.errors[0].message };
        return { success: false, error: err?.message || String(err) };
    }
}

import { addPlayersSchema, type AddPlayersInput } from '@/schemas/games';
import { Gaegu } from 'next/font/google';

export async function addPlayersAction(input: AddPlayersInput): Promise<{
    success: boolean;
    error?: string;
    // players added to game (newly inserted)
    addedPlayerIds?: string[];
    // players that were already in game
    alreadyInGame?: string[];
    // players created by this action
    createdPlayerIds?: string[];
    // provided playerIds that were invalid for the group
    invalidPlayerIds?: string[];
    // existing players matched from newPlayerNames
    matchedExistingPlayers?: { name: string; playerId: string }[];
}> {
    try {
        const data = addPlayersSchema.parse(input);

        const { gameId, playerIds = [], newPlayerNames = [] } = data;

        if (playerIds.length === 0 && newPlayerNames.length === 0) {
            return { success: false, error: 'No players provided' };
        }

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true, groupId: true }
        });

        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        const result = await prisma.$transaction(async (tx) => {
            const createdPlayerIds: string[] = [];
            const matchedExistingPlayers: { name: string; playerId: string }[] =
                [];

            // 1) Validate provided playerIds (must belong to game.groupId)
            let validProvidedPlayerIds: string[] = [];
            if (playerIds.length > 0) {
                const found = await tx.player.findMany({
                    where: { id: { in: playerIds }, groupId: game.groupId },
                    select: { id: true }
                });
                validProvidedPlayerIds = found.map((p) => p.id);
            }

            const invalidPlayerIds = playerIds.filter(
                (id) => !validProvidedPlayerIds.includes(id)
            );

            if (invalidPlayerIds.length > 0) {
                // Return early with details so client can correct selection
                return {
                    addedPlayerIds: [],
                    alreadyInGame: [],
                    createdPlayerIds: [],
                    invalidPlayerIds
                };
            }

            // 2) Handle newPlayerNames: dedupe and normalize
            const nameMap = new Map<string, string>(); // key: lower -> original trimmed
            for (const raw of newPlayerNames) {
                const trimmed = raw.trim();
                if (!trimmed) continue;
                const lower = trimmed.toLowerCase();
                if (!nameMap.has(lower)) nameMap.set(lower, trimmed);
            }
            const uniqueNames = Array.from(nameMap.values());

            // Find existing players that match any of the new names (case-insensitive)
            if (uniqueNames.length > 0) {
                const orChecks = uniqueNames.map((n) => ({
                    name: { equals: n, mode: 'insensitive' as const }
                }));
                const existing = await tx.player.findMany({
                    where: { groupId: game.groupId, OR: orChecks },
                    select: { id: true, name: true }
                });

                const existingByLower = new Map<
                    string,
                    { id: string; name: string }
                >();
                for (const ex of existing)
                    existingByLower.set(ex.name.toLowerCase(), ex);

                // For each unique name, either use existing player or create new
                for (const name of uniqueNames) {
                    const lower = name.toLowerCase();
                    const match = existingByLower.get(lower);
                    if (match) {
                        matchedExistingPlayers.push({
                            name,
                            playerId: match.id
                        });
                    } else {
                        // create player, handle race with P2002
                        try {
                            const p = await tx.player.create({
                                data: { groupId: game.groupId, name }
                            });
                            createdPlayerIds.push(p.id);
                        } catch (err: any) {
                            if (err?.code === 'P2002') {
                                // race: someone created it in-between, fetch it
                                const p = await tx.player.findFirst({
                                    where: {
                                        groupId: game.groupId,
                                        name: {
                                            equals: name,
                                            mode: 'insensitive' as const
                                        }
                                    }
                                });
                                if (p)
                                    matchedExistingPlayers.push({
                                        name,
                                        playerId: p.id
                                    });
                                else throw err;
                            } else {
                                throw err;
                            }
                        }
                    }
                }
            }

            // 3) Collect all player ids to add
            const allPlayerIdsSet = new Set<string>(validProvidedPlayerIds);
            for (const m of matchedExistingPlayers)
                allPlayerIdsSet.add(m.playerId);
            for (const id of createdPlayerIds) allPlayerIdsSet.add(id);
            const allPlayerIds = Array.from(allPlayerIdsSet);

            if (allPlayerIds.length === 0) {
                return {
                    addedPlayerIds: [],
                    alreadyInGame: [],
                    createdPlayerIds,
                    matchedExistingPlayers
                };
            }

            // 4) Determine which are already in game
            const existingGPs = await tx.gamePlayer.findMany({
                where: { gameId: gameId, playerId: { in: allPlayerIds } },
                select: { playerId: true }
            });
            const alreadyInGame = new Set(existingGPs.map((g) => g.playerId));

            const toInsert = allPlayerIds.filter(
                (id) => !alreadyInGame.has(id)
            );

            if (toInsert.length > 0) {
                // createMany with skipDuplicates just to be safe
                await tx.gamePlayer.createMany({
                    data: toInsert.map((id) => ({
                        gameId: gameId,
                        playerId: id
                    })),
                    skipDuplicates: true
                });
            }

            return {
                addedPlayerIds: toInsert,
                alreadyInGame: Array.from(alreadyInGame),
                createdPlayerIds,
                invalidPlayerIds: [],
                matchedExistingPlayers
            };
        });

        return { success: true, ...result };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length) {
            return { success: false, error: err.errors[0].message };
        }
        return { success: false, error: err?.message || String(err) };
    }
}

// List players in the game's group that are not already in the game
export async function listAvailablePlayersForGame(
    gameId: string
): Promise<Array<{ id: string; name: string }>> {
    if (!gameId) throw new Error('gameId is required');

    const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { id: true, groupId: true }
    });
    if (!game) return [];

    const players = await prisma.player.findMany({
        where: {
            groupId: game.groupId,
            AND: [{ games: { none: { gameId: gameId } } }]
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    return players;
}

// Undo a synthesized transaction (buy-in/adjustment/cashout) by resetting
// the corresponding per-player aggregate field. Transaction ids are in the
// form `gp-<gamePlayerId>-buyin|adjust|cashout` as emitted by the UI.
export async function undoTransactionAction(
    input: UndoTransactionInput
): Promise<{ success: boolean; error?: string; playerId?: string }> {
    try {
        const data = undoTransactionSchema.parse(input);
        const { gameId, transactionId } = data;

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true }
        });
        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is closed' };

        const m = transactionId.match(/^gp-(.+)-(buyin|adjust|cashout)$/);
        if (!m) return { success: false, error: 'Invalid transaction id' };

        const gpId = m[1];
        const txType = m[2];

        const gp = await prisma.gamePlayer.findUnique({
            where: { id: gpId },
            include: { player: true }
        });

        if (!gp) return { success: false, error: 'Transaction not found' };

        await prisma.$transaction(async (tx) => {
            if (txType === 'buyin') {
                await tx.gamePlayer.update({
                    where: { id: gp.id },
                    data: { buyInCents: 0 }
                });
            } else if (txType === 'adjust') {
                await tx.gamePlayer.update({
                    where: { id: gp.id },
                    data: { adjustmentCents: 0 }
                });
            } else {
                // cashout
                await tx.gamePlayer.update({
                    where: { id: gp.id },
                    data: { cashOutCents: null }
                });
            }
        });

        return { success: true, playerId: gp.player.id };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length)
            return { success: false, error: err.errors[0].message };
        return { success: false, error: err?.message || String(err) };
    }
}

// Close a game: set status to CLOSED, set closedAt, and return a shareId for results
export async function closeGameAction(
    input: CloseGameInput
): Promise<{ success: boolean; error?: string; shareId?: string }> {
    try {
        const data = closeGameSchema.parse(input);
        const { gameId } = data;

        const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, status: true, shareId: true }
        });

        if (!game) return { success: false, error: 'Game not found' };
        if (game.status === 'CLOSED')
            return { success: false, error: 'Game is already closed' };

        let shareId = game.shareId;
        if (!shareId) {
            // generate a new shareId if missing
            const { nanoid } = await import('nanoid');
            shareId = nanoid(6);
        }

        await prisma.game.update({
            where: { id: gameId },
            data: { status: 'CLOSED', closedAt: new Date(), shareId }
        });

        return { success: true, shareId };
    } catch (err: any) {
        if (err?.name === 'ZodError' && err?.errors?.length)
            return { success: false, error: err.errors[0].message };
        return { success: false, error: err?.message || String(err) };
    }
}
