import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { requireAdmin } from '@/src/server/auth/requireAdmin';
import { getSystemStats, getAllUsers, getAllLeagues } from '@/src/server/actions/adminActions';
import { AppNav } from '@/components/navigation/AppNav';
import { AdminDashboard } from './_components/AdminDashboard';

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  try {
    await requireAdmin();
  } catch {
    redirect('/');
  }

  const [stats, users, leagues] = await Promise.all([
    getSystemStats(),
    getAllUsers(),
    getAllLeagues(),
  ]);

  return (
    <div className="min-h-screen bg-app">
      <AppNav />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <AdminDashboard stats={stats} users={users} leagues={leagues} />
      </main>
    </div>
  );
}

