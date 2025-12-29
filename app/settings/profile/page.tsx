import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { getUserProfile } from '@/src/server/actions/userSettingsActions';
import { ProfileForm } from './_components/ProfileForm';
import { AppNav } from '@/components/navigation/AppNav';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ProfileSettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await getUserProfile();

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Update your personal information and profile details.
            </p>
          </div>

          <ProfileForm user={user} />
        </div>
      </main>
    </div>
  );
}

