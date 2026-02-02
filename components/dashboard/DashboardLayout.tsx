'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    LayoutDashboard,
    Gamepad2,
    Users,
    Settings,
    TrendingUp,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navigation = [
    {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard
    },
    {
        name: 'Games',
        href: '/games',
        icon: Gamepad2
    },
    {
        name: 'Players',
        href: '/players',
        icon: Users
    },
    {
        name: 'Stats',
        href: '/stats',
        icon: TrendingUp
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings
    }
];

function SidebarContent() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="border-b p-6">
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center"
                >
                    <Image
                        src="/images/logo.png"
                        alt="PkrTrackr"
                        width={200}
                        height={100}
                        className="h-auto w-full max-w-[180px]"
                        priority
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <p className="text-center text-xs text-muted-foreground">
                    Track the cash. Not the drama.
                </p>
            </div>
        </div>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 border-r bg-card lg:block">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background px-4 py-3 lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-bold">PkrTrackr</h1>
                </header>

                {/* Page Content */}
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
