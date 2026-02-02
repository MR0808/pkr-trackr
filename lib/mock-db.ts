import type { Game, Transaction } from '@/types/games';
import type { Player } from '@/types/players';

// Mock in-memory database
const games = new Map<string, Game>();
const shareLinks = new Map<string, string>(); // shareId -> gameId

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createGame(name: string): Game {
    const game: Game = {
        id: generateId(),
        name,
        status: 'OPEN',
        createdAt: new Date(),
        closedAt: null,
        players: [],
        transactions: []
    };
    games.set(game.id, game);
    return game;
}

export function getGame(gameId: string): Game | null {
    return games.get(gameId) || null;
}

export function getAllGames(): Game[] {
    return Array.from(games.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
}

export function getGameByShareId(shareId: string): Game | null {
    const gameId = shareLinks.get(shareId);
    return gameId ? getGame(gameId) : null;
}

export function addPlayer(gameId: string, name: string): Player | null {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return null;

    const player: Player = {
        id: generateId(),
        name,
        buyInsTotal: 0,
        cashout: null,
        adjustmentsTotal: 0,
        net: 0
    };

    game.players.push(player);
    return player;
}

export function addBuyIn(
    gameId: string,
    playerId: string,
    amount: number
): Transaction | null {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    const transaction: Transaction = {
        id: generateId(),
        playerId,
        playerName: player.name,
        type: 'BUY_IN',
        amount,
        timestamp: new Date()
    };

    player.buyInsTotal += amount;
    player.net =
        player.buyInsTotal + player.adjustmentsTotal - (player.cashout || 0);
    game.transactions.unshift(transaction);

    return transaction;
}

export function setCashout(
    gameId: string,
    playerId: string,
    amount: number
): Transaction | null {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    // Remove previous cashout transaction if exists
    game.transactions = game.transactions.filter(
        (t) => !(t.playerId === playerId && t.type === 'CASHOUT')
    );

    const transaction: Transaction = {
        id: generateId(),
        playerId,
        playerName: player.name,
        type: 'CASHOUT',
        amount,
        timestamp: new Date()
    };

    player.cashout = amount;
    player.net = player.buyInsTotal + player.adjustmentsTotal - amount;
    game.transactions.unshift(transaction);

    return transaction;
}

export function addAdjustment(
    gameId: string,
    playerId: string,
    amount: number,
    note?: string
): Transaction | null {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    const transaction: Transaction = {
        id: generateId(),
        playerId,
        playerName: player.name,
        type: 'ADJUSTMENT',
        amount,
        note,
        timestamp: new Date()
    };

    player.adjustmentsTotal += amount;
    player.net =
        player.buyInsTotal + player.adjustmentsTotal - (player.cashout || 0);
    game.transactions.unshift(transaction);

    return transaction;
}

export function undoTransaction(
    gameId: string,
    transactionId: string
): boolean {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return false;

    const transactionIndex = game.transactions.findIndex(
        (t) => t.id === transactionId
    );
    if (transactionIndex === -1) return false;

    const transaction = game.transactions[transactionIndex];
    const player = game.players.find((p) => p.id === transaction.playerId);
    if (!player) return false;

    // Can only undo buy-ins and adjustments (not cashouts)
    if (transaction.type === 'CASHOUT') return false;

    if (transaction.type === 'BUY_IN') {
        player.buyInsTotal -= transaction.amount;
    } else if (transaction.type === 'ADJUSTMENT') {
        player.adjustmentsTotal -= transaction.amount;
    }

    player.net =
        player.buyInsTotal + player.adjustmentsTotal - (player.cashout || 0);
    game.transactions.splice(transactionIndex, 1);

    return true;
}

export function closeGame(gameId: string): string | null {
    const game = games.get(gameId);
    if (!game || game.status === 'CLOSED') return null;

    game.status = 'CLOSED';
    game.closedAt = new Date();

    // Generate share link
    const shareId = generateId();
    shareLinks.set(shareId, gameId);

    return shareId;
}

export function getShareIdForGame(gameId: string): string | null {
    for (const [shareId, gId] of shareLinks.entries()) {
        if (gId === gameId) return shareId;
    }
    return null;
}

export function calculateGameTotals(game: Game): {
    totalIn: number;
    totalOut: number;
    bankDelta: number;
} {
    const totalIn = game.players.reduce(
        (sum, player) => sum + player.buyInsTotal,
        0
    );
    const totalOut = game.players.reduce(
        (sum, player) => sum + (player.cashout || 0),
        0
    );
    const bankDelta = totalIn - totalOut;

    return { totalIn, totalOut, bankDelta };
}

export function getAllPlayerStats(): Array<{
    name: string;
    gamesPlayed: number;
    totalBuyIns: number;
    totalCashouts: number;
    netProfit: number;
}> {
    const playerStats = new Map<
        string,
        {
            gamesPlayed: number;
            totalBuyIns: number;
            totalCashouts: number;
            netProfit: number;
        }
    >();

    for (const game of games.values()) {
        for (const player of game.players) {
            const existing = playerStats.get(player.name) || {
                gamesPlayed: 0,
                totalBuyIns: 0,
                totalCashouts: 0,
                netProfit: 0
            };

            existing.gamesPlayed += 1;
            existing.totalBuyIns += player.buyInsTotal;
            existing.totalCashouts += player.cashout || 0;
            existing.netProfit += player.net;

            playerStats.set(player.name, existing);
        }
    }

    return Array.from(playerStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.netProfit - a.netProfit);
}
