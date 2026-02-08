import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Gamepad2, Users } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
                <p className="text-muted-foreground">Manage seasons, players, and games.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/admin/seasons">
                    <Card className="transition-colors hover:bg-muted/50">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <CardTitle className="text-base">Seasons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Create, lock, and manage seasons.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/players">
                    <Card className="transition-colors hover:bg-muted/50">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Users className="h-5 w-5" />
                            <CardTitle className="text-base">Players</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Add and edit players.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/games">
                    <Card className="transition-colors hover:bg-muted/50">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Gamepad2 className="h-5 w-5" />
                            <CardTitle className="text-base">Games</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Create, edit, and close games.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
