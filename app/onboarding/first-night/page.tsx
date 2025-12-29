'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNight } from '@/src/server/actions/nightActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';

export default function OnboardingFirstNightPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateNight = async () => {
    setLoading(true);
    try {
      // Get league and season - in real implementation, get from context
      // For now, skip and go to dashboard
      router.push('/onboarding/complete');
    } catch (err) {
      console.error('Failed to create night:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/complete');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="flex justify-center mb-6">
          <Logo variant="icon" size="md" />
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-center">Create Your First Night</h1>
        <p className="text-brand-muted mb-6 text-center">
          You can create your first poker night now, or skip and do it later from your league
          dashboard.
        </p>
        <div className="space-y-3">
          <Button onClick={handleCreateNight} className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create First Night'}
          </Button>
          <Button onClick={handleSkip} variant="outline" className="w-full" disabled={loading}>
            Skip for Now
          </Button>
        </div>
      </Card>
    </div>
  );
}

