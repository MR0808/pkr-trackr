import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/admin-auth';
import { adminLogoutAction } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Calendar, Gamepad2, Users, LayoutDashboard, LogOut } from 'lucide-react';

export default async function AdminManageLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const ok = await getAdminSession();
    if (!ok) redirect('/admin');
    return (
        <div className="min-h-screen bg-background">
            <nav className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                </Link>
                <Link
                    href="/admin/seasons"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                    <Calendar className="h-4 w-4" />
                    Seasons
                </Link>
                <Link
                    href="/admin/players"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                    <Users className="h-4 w-4" />
                    Players
                </Link>
                <Link
                    href="/admin/games"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                    <Gamepad2 className="h-4 w-4" />
                    Games
                </Link>
                <form action={adminLogoutAction} className="ml-auto">
                    <Button type="submit" variant="ghost" size="sm" className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </form>
            </nav>
            <main className="container mx-auto max-w-4xl px-4 py-6">{children}</main>
        </div>
    );
}
