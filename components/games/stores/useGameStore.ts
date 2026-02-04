import { create } from 'zustand';
import { listAvailablePlayersForGame } from '@/actions/games';
import type { Player } from '@/types/players';

type OptOverride = {
    buyInsTotal?: number;
    cashout?: number | null;
    adjustmentsTotal?: number;
    net?: number;
};

const DEFAULT_AVAILABLE_PLAYERS_TTL = 5 * 60 * 1000; // 5 minutes
const ACTIVE_GAME_TTL = 30 * 1000; // 30 seconds (shorter for active tables)

export type GameStoreState = {
    optimisticAddedPlayers: Player[];
    optimisticOverrides: Record<string, OptOverride>;
    availablePlayersCache: Record<string, Array<{ id: string; name: string }>>;
    // timestamps for cache entries (ms since epoch)
    availablePlayersTimestamps: Record<string, number>;
    // per-game TTL in ms (overrides DEFAULT_AVAILABLE_PLAYERS_TTL)
    availablePlayersTTL: Record<string, number>;
    setAvailablePlayersTTL: (gameId: string, ttlMs: number) => void;
    // convenience helper for active games (shorter TTL)
    setActivePlayersTTL: (gameId: string) => void;
    resetAvailablePlayersTTL: (gameId: string) => void;
    addOptimisticPlayers: (players: Player[]) => void;
    revertOptimisticPlayers: (ids: string[]) => void;

    applyOptimisticBuyIn: (playerId: string, amount: number) => void;
    revertOptimistic: (playerId: string) => void;
    clearOptimisticForPlayer: (playerId: string) => void;

    getAvailablePlayers: (
        gameId: string
    ) => Promise<Array<{ id: string; name: string }>>;
    setAvailablePlayersCache: (
        gameId: string,
        list: Array<{ id: string; name: string }>
    ) => void;
    // Alias for clearing/invalidation (explicit name used in callers)
    invalidateAvailablePlayers: (gameId: string) => void;
    clearAvailablePlayersCache: (gameId: string) => void;

    // UI dialog control (store-driven modal for buy-in/cashout/adjustment)
    dialogOpen: boolean;
    dialogMode: 'buy-in' | 'cashout' | 'adjustment' | null;
    dialogPlayerId: string | null;
    openDialog: (
        playerId: string,
        mode: 'buy-in' | 'cashout' | 'adjustment'
    ) => void;
    closeDialog: () => void;
};

export const useGameStore = create<GameStoreState>((set, get) => ({
    optimisticAddedPlayers: [],
    optimisticOverrides: {},
    availablePlayersCache: {},
    availablePlayersTimestamps: {},
    availablePlayersTTL: {},

    addOptimisticPlayers: (players: Player[]) =>
        set((s: GameStoreState) => {
            const ids = new Set(s.optimisticAddedPlayers.map((p) => p.id));
            const toAdd = players.filter((p) => !ids.has(p.id));
            return {
                optimisticAddedPlayers: [...s.optimisticAddedPlayers, ...toAdd]
            };
        }),

    revertOptimisticPlayers: (ids: string[]) =>
        set((s: GameStoreState) => ({
            optimisticAddedPlayers: s.optimisticAddedPlayers.filter(
                (p) => !ids.includes(p.id)
            )
        })),

    applyOptimisticBuyIn: (playerId: string, amount: number) =>
        set((s: GameStoreState) => {
            const existing = s.optimisticOverrides[playerId] ?? {};
            const currentBuyIns = existing.buyInsTotal ?? 0;
            const updatedBuyIns = currentBuyIns + amount;
            const updatedNet = (existing.net ?? 0) + amount;
            return {
                optimisticOverrides: {
                    ...s.optimisticOverrides,
                    [playerId]: {
                        ...existing,
                        buyInsTotal: updatedBuyIns,
                        net: updatedNet
                    }
                }
            };
        }),

    revertOptimistic: (playerId: string) =>
        set((s: GameStoreState) => {
            const copy = { ...s.optimisticOverrides };
            delete copy[playerId];
            return { optimisticOverrides: copy };
        }),

    clearOptimisticForPlayer: (playerId: string) =>
        set((s: GameStoreState) => {
            const copy = { ...s.optimisticOverrides };
            delete copy[playerId];
            return {
                optimisticOverrides: copy,
                optimisticAddedPlayers: s.optimisticAddedPlayers.filter(
                    (p) => p.id !== playerId
                )
            };
        }),

    getAvailablePlayers: async (gameId) => {
        const cached = get().availablePlayersCache[gameId];
        const ts = get().availablePlayersTimestamps[gameId] ?? 0;
        const now = Date.now();
        // read per-game TTL if set, else fallback to default
        const TTL =
            get().availablePlayersTTL[gameId] ?? DEFAULT_AVAILABLE_PLAYERS_TTL;

        // return cached list if present and not expired
        if (cached && cached.length && now - ts < TTL) return cached;

        const list = await listAvailablePlayersForGame(gameId);
        set((s: GameStoreState) => ({
            availablePlayersCache: {
                ...s.availablePlayersCache,
                [gameId]: list
            },
            availablePlayersTimestamps: {
                ...s.availablePlayersTimestamps,
                [gameId]: Date.now()
            }
        }));
        return list;
    },

    setAvailablePlayersCache: (
        gameId: string,
        list: Array<{ id: string; name: string }>
    ) =>
        set((s: GameStoreState) => ({
            availablePlayersCache: {
                ...s.availablePlayersCache,
                [gameId]: list
            },
            availablePlayersTimestamps: {
                ...s.availablePlayersTimestamps,
                [gameId]: Date.now()
            }
        })),

    // Manual invalidation helper (alias to clear but explicit name)
    invalidateAvailablePlayers: (gameId: string) =>
        set((s: GameStoreState) => {
            const copy = { ...s.availablePlayersCache };
            delete copy[gameId];
            const ts = { ...s.availablePlayersTimestamps };
            delete ts[gameId];
            return {
                availablePlayersCache: copy,
                availablePlayersTimestamps: ts
            };
        }),

    // Per-game TTL control helpers
    setAvailablePlayersTTL: (gameId: string, ttlMs: number) =>
        set((s: GameStoreState) => ({
            availablePlayersTTL: {
                ...s.availablePlayersTTL,
                [gameId]: ttlMs
            }
        })),

    // Convenience to set a shorter TTL while the table is active
    setActivePlayersTTL: (gameId: string) =>
        set((s: GameStoreState) => ({
            availablePlayersTTL: {
                ...s.availablePlayersTTL,
                [gameId]: ACTIVE_GAME_TTL
            }
        })),

    resetAvailablePlayersTTL: (gameId: string) =>
        set((s: GameStoreState) => {
            const copy = { ...s.availablePlayersTTL };
            delete copy[gameId];
            return { availablePlayersTTL: copy };
        }),

    clearAvailablePlayersCache: (gameId: string) =>
        set((s: GameStoreState) => {
            const copy = { ...s.availablePlayersCache };
            delete copy[gameId];
            const ts = { ...s.availablePlayersTimestamps };
            delete ts[gameId];
            return {
                availablePlayersCache: copy,
                availablePlayersTimestamps: ts
            };
        }),

    // Dialog control
    dialogOpen: false,
    dialogMode: null,
    dialogPlayerId: null,
    openDialog: (playerId: string, mode: 'buy-in' | 'cashout' | 'adjustment') =>
        set(() => ({
            dialogOpen: true,
            dialogMode: mode,
            dialogPlayerId: playerId
        })),
    closeDialog: () =>
        set(() => ({
            dialogOpen: false,
            dialogMode: null,
            dialogPlayerId: null
        }))
}));
