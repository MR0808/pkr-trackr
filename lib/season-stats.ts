import { prisma } from '@/lib/prisma';

/** Rebuild cached season rollups from all game_players in that season. */
export async function recomputeSeasonPlayerStats(seasonId: string): Promise<void> {
    const gps = await prisma.gamePlayer.findMany({
        where: { game: { seasonId } },
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

    const playerIds = Array.from(byPlayer.keys());

    await prisma.$transaction(async (tx) => {
        if (playerIds.length === 0) {
            await tx.seasonPlayerStats.deleteMany({ where: { seasonId } });
            return;
        }

        await tx.seasonPlayerStats.deleteMany({
            where: { seasonId, playerId: { notIn: playerIds } }
        });

        for (const [playerId, tot] of byPlayer) {
            const profit = tot.cashOut - tot.buyIn - tot.adjustment;
            await tx.seasonPlayerStats.upsert({
                where: { seasonId_playerId: { seasonId, playerId } },
                update: {
                    totalBuyInCents: tot.buyIn,
                    totalCashOutCents: tot.cashOut,
                    totalProfitCents: profit,
                    totalGames: tot.games
                },
                create: {
                    seasonId,
                    playerId,
                    totalBuyInCents: tot.buyIn,
                    totalCashOutCents: tot.cashOut,
                    totalProfitCents: profit,
                    totalGames: tot.games
                }
            });
        }
    });
}
