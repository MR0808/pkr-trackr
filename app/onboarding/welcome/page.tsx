import { redirect } from 'next/navigation';
import { getSession } from '@/src/server/auth/getSession';
import { prisma } from '@/lib/prisma';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function OnboardingWelcomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if onboarding already completed
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  if (user?.onboardingCompletedAt) {
    redirect('/');
  }

  // Get user's firstName
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true },
  });

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <Logo variant="lockup" size="lg" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-brand-fg">
            Welcome to Pkr Trackr{userData?.firstName ? `, ${userData.firstName}` : ''}
          </h1>
          <p className="text-brand-muted text-lg">
            Track poker nights, leagues, and long-term performance — objectively.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/onboarding/league">
            <Button size="lg" className="w-full">
              Create your first league
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

