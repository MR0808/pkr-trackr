import { getSession } from '@/src/server/auth/getSession';
import { Logo } from '@/components/brand/Logo';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import Link from 'next/link';

export async function AppNav() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-nav bg-nav">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <Logo variant="icon" size="md" />
          <span className="text-xl font-semibold">Pkr Trackr</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu
            user={{
              id: session.user.id,
              firstName: session.user.firstName || '',
              lastName: session.user.lastName || '',
              email: session.user.email || '',
              isAdmin: session.user.isAdmin,
            }}
          />
        </div>
      </nav>
    </header>
  );
}

