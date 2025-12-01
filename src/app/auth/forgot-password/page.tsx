'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For a real implementation, we'd integrate with Clerk's password reset API
    // For now, we'll just simulate the submission
    console.log("Password reset requested for:", email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
                Check Your Email
              </h1>
              <p className="text-muted-foreground text-base font-normal leading-normal">
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <Button asChild className="w-full">
                <Link href="/sign-in">Back to Sign In</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Remember your password? <span className="font-bold">Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
              Forgot Your Password?
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Enter your email and we'll send you a link to get back into your account.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <Label className="w-full">
              <p className="text-foreground text-base font-medium leading-normal pb-2">
                Email Address
              </p>
              <div className="flex w-full flex-1 items-stretch rounded-lg group">
                <Input
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-input bg-background focus:border-primary/80 h-12 placeholder:text-muted-foreground p-3 text-base font-normal leading-normal"
                  id="email"
                  placeholder="e.g., yourname@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Label>
            <Button className="w-full" type="submit">
              Send Password Reset Link
            </Button>
          </form>
        </div>
        <div className="flex items-center justify-center">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Remember your password? <span className="font-bold">Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
