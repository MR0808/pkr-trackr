'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupWithName } from '@/src/server/actions/authActions';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signupWithName({
        firstName,
        lastName,
        email,
        password,
      });

      // Sign in with Better Auth client
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        // Account created but sign-in failed, redirect to login
        router.push('/login?message=Account created, please sign in');
        return;
      }

      router.push('/onboarding/welcome');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <div className="flex justify-center mb-6">
          <Logo variant="lockup" size="lg" />
        </div>
        <h1 className="text-2xl font-semibold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password *
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-red hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

