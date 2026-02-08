'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { importGamesFromCsvAction } from '@/actions/importGamesFromCsv';

export function ImportForm() {
    const [csv, setCsv] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        error?: string;
        gamesCreated?: number;
        playersCreated?: number;
        rowsProcessed?: number;
    } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!csv.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await importGamesFromCsvAction(csv.trim());
            setResult(res);
            if (res.success) setCsv('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                placeholder="Paste your CSV here (headers: season_name, game_date, game_name, player_name, buy_in, cash_out)..."
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                disabled={loading}
            />
            <Button type="submit" disabled={loading || !csv.trim()}>
                {loading ? 'Importing…' : 'Import'}
            </Button>
            {result && (
                <div
                    className={
                        result.success
                            ? 'rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                    }
                >
                    {result.success ? (
                        <>
                            Imported {result.gamesCreated} games, {result.rowsProcessed} rows processed.
                            {result.playersCreated !== undefined && result.playersCreated > 0 && (
                                <> {result.playersCreated} new players created.</>
                            )}
                        </>
                    ) : (
                        result.error
                    )}
                </div>
            )}
        </form>
    );
}
