'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { completeOnboarding } from '@/src/server/actions/onboardingActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';
import { CheckCircle } from 'lucide-react';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const markComplete = async () => {
      try {
        await completeOnboarding();
        setLoading(false);
        // Redirect after a moment
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err) {
        console.error('Failed to complete onboarding:', err);
        setLoading(false);
      }
    };

    markComplete();
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="flex justify-center mb-6">
          <Logo variant="lockup" size="lg" />
        </div>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-brand-profit" />
          </div>
          <h1 className="text-2xl font-semibold">You're All Set!</h1>
          <div className="space-y-2 text-sm text-brand-muted">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-brand-profit" />
              <span>League created</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-brand-profit" />
              <span>Players added</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-brand-profit" />
              <span>Ready to track</span>
            </div>
          </div>
          {!loading && (
            <Button onClick={() => router.push('/')} className="w-full mt-6">
              Go to Dashboard
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

