import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { requireAdmin } from '@/src/server/auth/requireAdmin';
import { getSystemStats, getAllUsers, getAllLeagues } from '@/src/server/actions/adminActions';
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
              ← Back to App
            </a>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <AdminDashboard stats={stats} users={users} leagues={leagues} />
      </main>
    </div>
  );
}

