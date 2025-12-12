'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { Eye, EyeOff, Github, Mail } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoaded } = useSignIn();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    try {
      await signIn.create({
        identifier: email,
        password,
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to sign in');
    }
  };

  return (
    <AuthCard mode="sign-in">
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-white">
            Create an account
          </h2>
          {/* Note: In the image it says "Create an account" even on the toggle for Sign up/Sign in potentially? 
              Actually, usually "Welcome back" for sign in. 
              The image shows "Create an account" while "Sign up" is selected.
              I should probably change this text based on mode, but since I am in "Sign In" page,
              I will use "Welcome back" or similar, OR strict adherence to image if I was on sign up.
              Let's use "Welcome back" for Sign In context to be logical.
          */}
          <h2 className="text-2xl font-semibold text-white">
            Welcome back
          </h2>
        </div>

        {/* Login Form */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:border-white/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 pr-10 focus-visible:ring-offset-0 focus-visible:border-white/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/40 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Link
            href="/auth/forgot-password"
            className="text-right text-xs font-medium text-white/60 hover:text-white"
          >
            Forgot Password?
          </Link>

          <Button
            type="submit"
            className="h-12 w-full rounded-lg bg-white text-black hover:bg-white/90 font-semibold"
          >
            Log In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 text-white/20">
          <Separator className="bg-white/10" />
          <p className="text-xs font-medium whitespace-nowrap">OR SIGN IN WITH</p>
          <Separator className="bg-white/10" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white border-0"
            onClick={() => signIn?.authenticateWithRedirect({
              strategy: 'oauth_google',
              redirectUrl: '/dashboard',
              redirectUrlComplete: '/auth/callback',
            })}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </Button>
          <Button
            variant="outline"
            className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white border-0"
            onClick={() => signIn?.authenticateWithRedirect({
              strategy: 'oauth_github',
              redirectUrl: '/dashboard',
              redirectUrlComplete: '/auth/callback',
            })}
          >
            <Github className="h-5 w-5 fill-white" />
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

