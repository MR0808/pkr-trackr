'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Calendar, Moon, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
    { href: '/stats', label: 'Overview', icon: BarChart3 },
    { href: '/stats/players', label: 'Players', icon: Users },
    { href: '/stats/seasons', label: 'Seasons', icon: Calendar },
    { href: '/stats/nights', label: 'Nights', icon: Moon },
    { href: '/stats/insights', label: 'Insights', icon: Lightbulb }
] as const;

export function StatsNav() {
    const pathname = usePathname();

    return (
        <nav
            className="flex flex-wrap gap-1 border-b border-border bg-background"
            aria-label="Stats sections"
        >
            {tabs.map(({ href, label, icon: Icon }) => {
                const isActive =
                    href === '/stats'
                        ? pathname === '/stats'
                        : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            'flex items-center gap-2 rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                                ? 'border-b-2 border-primary bg-background text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
