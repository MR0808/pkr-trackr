import { Player } from './players';

import {
    loadGamesForGroup,
    loadGamesListPageData
} from '@/actions/games';

export type LoadGamesForGroupResult = Awaited<
    ReturnType<typeof loadGamesForGroup>
>;

export type GamesListPageData = Awaited<
    ReturnType<typeof loadGamesListPageData>
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
    scheduledAt: Date;
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

export interface GamesListPageProps {
    data: GamesListPageData;
}
