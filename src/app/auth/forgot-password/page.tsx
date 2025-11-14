/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClientComponentClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSubmitted(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center whitespace-nowrap px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="size-6 text-primary">
           MF
          </div>
          <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">MuseFlow</h2>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-10 px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="w-full flex flex-col gap-6 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <span className="text-primary text-2xl">check_circle</span>
                </div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">Check your email</h1>
                <p className="text-muted-foreground text-center">
                  We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>.
                  Click the link in the email to reset your password.
                </p>
                <Button className="w-full mt-2" onClick={() => setSubmitted(false)}>
                  Back to Reset Password
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center gap-2">
                  <h1 className="text-foreground text-2xl font-bold tracking-tight">Forgot Your Password?</h1>
                  <p className="text-muted-foreground">
                    Enter your email and we&apos;ll send you a link to get back into your account.
                  </p>
                </div>
                
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending reset link...' : 'Send Reset Link'}
                  </Button>
                </form>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Remember your password?{' '}
                    <Link href="/auth/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}