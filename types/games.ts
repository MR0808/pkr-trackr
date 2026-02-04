import { Player } from './players';

import { loadGamesForGroup } from '@/actions/games';

export type LoadGamesForGroupResult = Awaited<
    ReturnType<typeof loadGamesForGroup>
>;

export type GameStatus = 'OPEN' | 'CLOSED';

export type TransactionType = 'BUY_IN' | 'CASHOUT' | 'ADJUSTMENT';

export interface Game {
    id: string;
    name: string;
    status: GameStatus;
    createdAt: Date;
    closedAt: Date | null;
    players: Player[];
    transactions: Transaction[];
}

export interface Transaction {
    id: string;
    playerId: string;
    playerName: string;
    type: TransactionType;
    amount: number;
    note?: string;
    timestamp: Date;
}

export interface GameTotals {
    totalIn: number;
    totalOut: number;
    bankDelta: number;
}

export interface GamesListProps {
    games: LoadGamesForGroupResult;
}
