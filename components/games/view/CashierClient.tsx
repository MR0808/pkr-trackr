'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, Transaction } from '@/types/games';
import type { Player } from '@/types/players';
import { PlayerCard } from '@/components/games/view/PlayerCard';
import { AddPlayerDialog } from '@/components/games/view/AddPlayerDialog';
import { useGameStore } from '@/components/games/stores/useGameStore';
import { AmountDialog } from '@/components/games/view/AmountDialog';
import { ActivityFeed } from '@/components/games/view/ActivityFeed';

interface CashierClientProps {
    game: Game;
}

export function CashierClient({ game }: CashierClientProps) {
    const router = useRouter();

    // Centralized optimistic state and caching via Zustand
    const optimisticOverrides = useGameStore((s) => s.optimisticOverrides);
    const optimisticAddedPlayers = useGameStore(
        (s) => s.optimisticAddedPlayers
    );
    const applyOptimisticBuyIn = useGameStore((s) => s.applyOptimisticBuyIn);
    const revertOptimistic = useGameStore((s) => s.revertOptimistic);
    const clearOptimisticForPlayer = useGameStore(
        (s) => s.clearOptimisticForPlayer
    );
    const addOptimisticPlayers = useGameStore((s) => s.addOptimisticPlayers);
    const revertOptimisticPlayers = useGameStore(
        (s) => s.revertOptimisticPlayers
    );
    const getAvailablePlayers = useGameStore((s) => s.getAvailablePlayers);

    // Dialog control (store-driven)
    const dialogOpen = useGameStore((s) => s.dialogOpen);
    const dialogMode = useGameStore((s) => s.dialogMode);
    const dialogPlayerId = useGameStore((s) => s.dialogPlayerId);
    const openDialog = useGameStore((s) => s.openDialog);
    const closeDialog = useGameStore((s) => s.closeDialog);

    // TTL control helpers
    const setActivePlayersTTL = useGameStore((s) => s.setActivePlayersTTL);
    const resetAvailablePlayersTTL = useGameStore(
        (s) => s.resetAvailablePlayersTTL
    );

    const handleCustomBuyIn = (player: Player) => {
        openDialog(player.id, 'buy-in');
    };

    const handleCashout = (player: Player) => {
        openDialog(player.id, 'cashout');
    };

    const handleAdjustment = (player: Player) => {
        openDialog(player.id, 'adjustment');
    };

    // applyOptimisticBuyIn moved to Zustand store; use applyOptimisticBuyIn selector above

    // revertOptimistic moved to Zustand store; use revertOptimistic selector above

    // clearOptimisticAndRefresh kept as a small helper that clears store state, refreshes, and closes the dialog
    const clearOptimisticAndRefresh = (playerId: string) => {
        clearOptimisticForPlayer(playerId);
        router.refresh();
        closeDialog();
    };

    // addOptimisticPlayers/revertOptimisticPlayers are provided directly by the store selectors (see above)

    // Capture playerId into a stable variable for dialog callbacks so it doesn't become
    // null during unmount/close actions.
    const dialogPlayerIdForCallbacks = dialogPlayerId;

    // Resolve the dialog player object from game players + optimistic players
    const dialogPlayer = useMemo(
        () =>
            ([...game.players, ...optimisticAddedPlayers].find(
                (p) => p.id === dialogPlayerId
            ) as Player | undefined) ?? undefined,
        [game.players, optimisticAddedPlayers, dialogPlayerId]
    );

    // Quick actions local state for a small centralized trigger UI
    const [quickPlayerId, setQuickPlayerId] = useState<string>('');

    // When a table becomes active, reduce available-players TTL so frequently
    // opened add-player dialogs fetch fresher data. Reset TTL when not active.
    useEffect(() => {
        if (game.status === 'OPEN') {
            setActivePlayersTTL(game.id);
        } else {
            resetAvailablePlayersTTL(game.id);
        }
    }, [game.status, game.id, setActivePlayersTTL, resetAvailablePlayersTTL]);

    // TTL selector value from store (undefined means default)
    const availablePlayersTTLForGame = useGameStore(
        (s) => s.availablePlayersTTL[game.id]
    );
    const setAvailablePlayersTTL = useGameStore(
        (s) => s.setAvailablePlayersTTL
    );

    const handleEditCashout = (transaction: Transaction) => {
        // Open the store-driven dialog for cashout edits
        openDialog(transaction.playerId, 'cashout');
    };

    return (
        <div>
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Player Grid - Left side on desktop */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm">Quick buy-in:</label>
                            <select
                                value={quickPlayerId}
                                onChange={(e) =>
                                    setQuickPlayerId(e.target.value)
                                }
                                className="rounded-md border px-2 py-1 text-sm"
                                aria-label="Select player for quick buy-in"
                            >
                                <option value="">Select player…</option>
                                {game.players.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                                {optimisticAddedPlayers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="ml-2 rounded-md px-3 py-1 bg-primary text-white text-sm cursor-pointer"
                                onClick={() =>
                                    quickPlayerId &&
                                    openDialog(quickPlayerId, 'buy-in')
                                }
                                disabled={!quickPlayerId}
                            >
                                Open Buy-in
                            </button>
                        </div>

                        {process.env.NODE_ENV !== 'production' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <label className="text-xs">
                                    Cache TTL (dev):
                                </label>
                                <select
                                    value={String(
                                        availablePlayersTTLForGame ?? 'default'
                                    )}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === 'reset' || v === 'default') {
                                            resetAvailablePlayersTTL(game.id);
                                        } else {
                                            setAvailablePlayersTTL(
                                                game.id,
                                                Number(v)
                                            );
                                        }
                                    }}
                                    className="rounded-md border px-2 py-1 text-sm"
                                    aria-label="Set available players cache TTL"
                                >
                                    <option value="default">
                                        Default (5m)
                                    </option>
                                    <option value="30000">30s</option>
                                    <option value="60000">1m</option>
                                    <option value="300000">5m</option>
                                    <option value="600000">10m</option>
                                    <option value="reset">Reset</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:gap-4">
                        {[
                            ...game.players,
                            ...optimisticAddedPlayers.filter(
                                (p) =>
                                    !game.players.some((gp) => gp.id === p.id)
                            )
                        ]
                            .sort((a, b) =>
                                a.name.localeCompare(b.name, undefined, {
                                    sensitivity: 'base'
                                })
                            )
                            .map((player) => (
                            <PlayerCard
                                key={player.id}
                                player={player}
                                gameId={game.id}
                                isGameClosed={game.status === 'CLOSED'}
                                onCustomBuyIn={() => handleCustomBuyIn(player)}
                                onCashout={() => handleCashout(player)}
                                onAdjustment={() => handleAdjustment(player)}
                                optimisticOverride={
                                    optimisticOverrides[player.id]
                                }
                                onApplyOptimisticBuyIn={(playerId, amount) =>
                                    applyOptimisticBuyIn(playerId, amount)
                                }
                                onRevertOptimistic={(playerId) =>
                                    revertOptimistic(playerId)
                                }
                                onFinalizeOptimistic={(playerId) =>
                                    clearOptimisticAndRefresh(playerId)
                                }
                                isTemporary={String(player.id).startsWith(
                                    'temp-'
                                )}
                            />
                        ))}

                        <AddPlayerDialog
                            gameId={game.id}
                            isGameClosed={game.status === 'CLOSED'}
                            onOptimisticAdd={(players) =>
                                addOptimisticPlayers(players as Player[])
                            }
                            onOptimisticRevert={(ids) =>
                                revertOptimisticPlayers(ids)
                            }
                        />
                    </div>
                </div>

                {/* Activity Feed - Right side on desktop */}
                <div className="lg:col-span-4">
                    <ActivityFeed
                        transactions={game.transactions}
                        gameId={game.id}
                        isGameClosed={game.status === 'CLOSED'}
                        onEditCashout={handleEditCashout}
                    />
                </div>
            </div>

            {/* Amount Dialog */}
            {dialogOpen && dialogMode && dialogPlayer && (
                <AmountDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    player={dialogPlayer}
                    gameId={game.id}
                    mode={dialogMode}
                    onOptimisticAdd={(amount) =>
                        applyOptimisticBuyIn(
                            dialogPlayerIdForCallbacks!,
                            amount
                        )
                    }
                    onOptimisticRevert={() =>
                        revertOptimistic(dialogPlayerIdForCallbacks!)
                    }
                    onSuccess={() =>
                        clearOptimisticAndRefresh(dialogPlayerIdForCallbacks!)
                    }
                />
            )}
        </div>
    );
}
