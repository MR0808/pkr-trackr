import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { AppNav } from '@/components/navigation/AppNav';
import { NewLeagueForm } from './_components/NewLeagueForm';

export default async function NewLeaguePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-app">
      <AppNav />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <NewLeagueForm />
      </main>
    </div>
  );
}

