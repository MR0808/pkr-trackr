'use server';

import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { getDefaultGroupId } from '@/lib/default-group';

type CsvRow = {
    season_name: string;
    game_date: string;
    game_name: string;
    player_name: string;
    buy_in: string;
    cash_out: string;
    adjustment?: string;
};

function parseCsv(csvText: string): CsvRow[] {
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase();
    const cols = header.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const seasonIdx = cols.findIndex((c) => c === 'season_name' || c === 'season');
    const dateIdx = cols.findIndex((c) => c === 'game_date' || c === 'date');
    const gameIdx = cols.findIndex((c) => c === 'game_name' || c === 'game');
    const playerIdx = cols.findIndex((c) => c === 'player_name' || c === 'player');
    const buyInIdx = cols.findIndex((c) => c === 'buy_in' || c === 'buyin');
    const cashOutIdx = cols.findIndex((c) => c === 'cash_out' || c === 'cashout');
    const adjIdx = cols.findIndex((c) => c === 'adjustment' || c === 'adj');
    if (
        seasonIdx === -1 ||
        dateIdx === -1 ||
        gameIdx === -1 ||
        playerIdx === -1 ||
        buyInIdx === -1 ||
        cashOutIdx === -1
    ) {
        throw new Error(
            'CSV must have headers: season_name, game_date, game_name, player_name, buy_in, cash_out'
        );
    }
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if ((ch === ',' && !inQuotes) || (ch === '\n' && !inQuotes)) {
                values.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        values.push(cur.trim());
        const get = (idx: number) => (idx >= 0 && idx < values.length ? values[idx].replace(/^"|"$/g, '') : '');
        rows.push({
            season_name: get(seasonIdx),
            game_date: get(dateIdx),
            game_name: get(gameIdx),
            player_name: get(playerIdx),
            buy_in: get(buyInIdx),
            cash_out: get(cashOutIdx),
            adjustment: adjIdx >= 0 ? get(adjIdx) : undefined
        });
    }
    return rows.filter(
        (r) =>
            r.season_name &&
            r.game_date &&
            r.game_name &&
            r.player_name &&
            r.buy_in !== ''
    );
}

function parseDollars(s: string): number {
    const n = parseFloat(String(s).replace(/[$,]/g, '')) || 0;
    return Math.round(n * 100);
}

function parseDate(s: string): Date {
    const str = s.trim();
    // YYYY-MM-DD
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    // dd/mm/yyyy or d/m/yyyy (day, month, year)
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
        const day = parseInt(dmy[1], 10);
        const month = parseInt(dmy[2], 10) - 1;
        const year = parseInt(dmy[3], 10);
        if (month >= 0 && month <= 11) {
            const d = new Date(year, month, day);
            if (!Number.isNaN(d.getTime())) return d;
        }
    }
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${str}`);
    return d;
}

export async function importGamesFromCsvAction(csvText: string): Promise<{
    success: boolean;
    error?: string;
    gamesCreated?: number;
    playersCreated?: number;
    rowsProcessed?: number;
}> {
    try {
        const groupId = await getDefaultGroupId();
        const rows = parseCsv(csvText);
        if (rows.length === 0) return { success: false, error: 'No valid rows to import' };

        const gameKey = (r: CsvRow) => `${r.season_name}\t${r.game_date}\t${r.game_name}`;
        const gameRows = new Map<string, CsvRow[]>();
        for (const r of rows) {
            const key = gameKey(r);
            if (!gameRows.has(key)) gameRows.set(key, []);
            gameRows.get(key)!.push(r);
        }

        let gamesCreated = 0;
        let playersCreated = 0;
        const seasonIdsByName = new Map<string, string>();

        await prisma.$transaction(
            async (tx) => {
            for (const [key, playerRows] of gameRows) {
                const [seasonName, dateStr, gameName] = key.split('\t');
                const gameDate = parseDate(dateStr);

                let seasonId = seasonIdsByName.get(seasonName);
                if (!seasonId) {
                    const existing = await tx.season.findFirst({
                        where: { groupId, name: seasonName }
                    });
                    if (existing) {
                        seasonId = existing.id;
                    } else {
                        const start = new Date(gameDate.getFullYear(), 0, 1);
                        const end = new Date(gameDate.getFullYear(), 11, 31);
                        const season = await tx.season.create({
                            data: {
                                groupId,
                                name: seasonName,
                                startsAt: start,
                                endsAt: end
                            }
                        });
                        seasonId = season.id;
                    }
                    seasonIdsByName.set(seasonName, seasonId);
                }

                const shareId = nanoid(16);
                const game = await tx.game.create({
                    data: {
                        groupId,
                        seasonId,
                        name: gameName,
                        status: 'CLOSED',
                        scheduledAt: gameDate,
                        closedAt: gameDate,
                        shareId
                    }
                });
                gamesCreated++;

                const playerMap = new Map<string, string>();
                for (const r of playerRows) {
                    const name = r.player_name.trim();
                    if (!name) continue;
                    let playerId = playerMap.get(name.toLowerCase());
                    if (!playerId) {
                        let player = await tx.player.findFirst({
                            where: {
                                groupId,
                                name: { equals: name, mode: 'insensitive' }
                            }
                        });
                        if (!player) {
                            player = await tx.player.create({
                                data: { groupId, name }
                            });
                            playersCreated++;
                        }
                        playerId = player.id;
                        playerMap.set(name.toLowerCase(), playerId);
                    }

                    const buyInCents = parseDollars(r.buy_in);
                    const cashOutCents = r.cash_out !== '' && r.cash_out != null ? parseDollars(r.cash_out) : 0;
                    const adjustmentCents = r.adjustment ? parseDollars(r.adjustment) : 0;

                    await tx.gamePlayer.upsert({
                        where: {
                            gameId_playerId: { gameId: game.id, playerId }
                        },
                        create: {
                            gameId: game.id,
                            playerId,
                            buyInCents,
                            cashOutCents: cashOutCents > 0 ? cashOutCents : null,
                            adjustmentCents
                        },
                        update: {
                            buyInCents,
                            cashOutCents: cashOutCents > 0 ? cashOutCents : null,
                            adjustmentCents
                        }
                    });
                }
            }
            },
            { timeout: 60_000 }
        );

        // Recompute season stats from actual game_players
        const seasonIds = Array.from(seasonIdsByName.values());
        for (const sid of seasonIds) {
            const gps = await prisma.gamePlayer.findMany({
                where: { game: { seasonId: sid } },
                select: {
                    playerId: true,
                    buyInCents: true,
                    cashOutCents: true,
                    adjustmentCents: true
                }
            });
            const byPlayer = new Map<
                string,
                { buyIn: number; cashOut: number; adjustment: number; games: number }
            >();
            for (const gp of gps) {
                const cur = byPlayer.get(gp.playerId) ?? {
                    buyIn: 0,
                    cashOut: 0,
                    adjustment: 0,
                    games: 0
                };
                cur.buyIn += gp.buyInCents;
                cur.cashOut += gp.cashOutCents ?? 0;
                cur.adjustment += gp.adjustmentCents;
                cur.games += 1;
                byPlayer.set(gp.playerId, cur);
            }
            for (const [playerId, tot] of byPlayer) {
                const profit = tot.cashOut - tot.buyIn - tot.adjustment;
                await prisma.seasonPlayerStats.upsert({
                    where: { seasonId_playerId: { seasonId: sid, playerId } },
                    update: {
                        totalBuyInCents: tot.buyIn,
                        totalCashOutCents: tot.cashOut,
                        totalProfitCents: profit,
                        totalGames: tot.games
                    },
                    create: {
                        seasonId: sid,
                        playerId,
                        totalBuyInCents: tot.buyIn,
                        totalCashOutCents: tot.cashOut,
                        totalProfitCents: profit,
                        totalGames: tot.games
                    }
                });
            }
        }

        return {
            success: true,
            gamesCreated,
            playersCreated,
            rowsProcessed: rows.length
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}
