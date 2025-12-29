'use client';

import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import Link from 'next/link';

interface AppNavClientProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin?: boolean;
  };
}

export function AppNavClient({ user }: AppNavClientProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo variant="icon" size="md" />
          <span className="text-xl font-semibold">Pkr Trackr</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </nav>
    </header>
  );
}

