import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportForm } from '@/components/import/ImportForm';

export default function ImportPage() {
    return (
        <div className="container mx-auto max-w-3xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Import historical games
                    </h1>
                    <p className="text-muted-foreground">
                        Upload a CSV to add Season 2024, 2025, or any past games
                    </p>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>
                        CSV format: season_name, game_date, game_name,
                        player_name, buy_in, cash_out
                    </span>
                </div>
                {/* <ImportForm /> */}
            </div>

            <p className="text-sm text-muted-foreground">
                See{' '}
                <code className="rounded bg-muted px-1 py-0.5">
                    docs/CSV_IMPORT.md
                </code>{' '}
                for the full format and examples.
            </p>
        </div>
    );
}
