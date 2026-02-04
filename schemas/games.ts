import { z } from 'zod';

export const createGameSchema = z.object({
    name: z
        .string()
        .min(1, 'Game name is required')
        .max(100, 'Game name is too long'),
    date: z.date({ error: 'Game date is required' })
});

export const addPlayerSchema = z.object({
    gameId: z.string().min(1),
    name: z
        .string()
        .min(1, 'Player name is required')
        .max(50, 'Player name is too long')
});

export const buyInSchema = z.object({
    gameId: z.string().min(1),
    playerId: z.string().min(1),
    amount: z
        .number()
        .positive('Amount must be positive')
        .max(100000, 'Amount is too large')
});

export const cashoutSchema = z.object({
    gameId: z.string().min(1),
    playerId: z.string().min(1),
    amount: z
        .number()
        .min(0, 'Amount cannot be negative')
        .max(100000, 'Amount is too large')
});

export const adjustmentSchema = z.object({
    gameId: z.string().min(1),
    playerId: z.string().min(1),
    amount: z
        .number()
        .refine((val) => val !== 0, 'Adjustment cannot be zero')
        .refine((val) => Math.abs(val) <= 100000, 'Amount is too large'),
    note: z.string().optional()
});

export const undoTransactionSchema = z.object({
    gameId: z.string().min(1),
    transactionId: z.string().min(1)
});

export const closeGameSchema = z.object({
    gameId: z.string().min(1)
});

// Add multiple players: existing ids and/or new player names
export const addPlayersSchema = z.object({
    gameId: z.string().min(1),
    // existing player ids to add to the game
    playerIds: z.array(z.string().min(1)).optional(),
    // new players by name to create and add (names must be unique within group)
    newPlayerNames: z.array(z.string().min(1).max(50)).optional()
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type AddPlayerInput = z.infer<typeof addPlayerSchema>;
export type AddPlayersInput = z.infer<typeof addPlayersSchema>;
export type BuyInInput = z.infer<typeof buyInSchema>;
export type CashoutInput = z.infer<typeof cashoutSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
export type UndoTransactionInput = z.infer<typeof undoTransactionSchema>;
export type CloseGameInput = z.infer<typeof closeGameSchema>;
