'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button onClick={handleSignOut} variant="ghost" size="sm">
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  );
}

