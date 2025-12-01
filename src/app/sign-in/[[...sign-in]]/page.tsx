'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { Eye, EyeOff, Github, Mail } from 'lucide-react';

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
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1">
          <div className="flex w-full flex-col items-center justify-center md:flex-row">
            {/* Left Column: Image and Branding */}
            <div className="relative hidden h-full flex-1 items-center justify-center bg-gray-900 md:flex">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuADm0Rm5-97J0RWGJRaf0kaJzifpxkl8pR_DHsClJz68dh6O7gxu7yLvHA5qWomZsvXLNju_oKxdrKOzJct7zNCR7XVL1xFshlzbLiq87RG8QjY7rtxHQMkVAdAgODXYZDv2jAaOf5lFuZs22mWi_CilHKLMOVMrB8kgxHMyN2OIglVw5yfZbmM90k8MYxL2_t1tibmtOTqBhPfMFm8hKe3uf8TWd2F3ch8Uoc774MDxp6UP4JKJXWM6-Y595IIivKfzzvJuW54Wg)',
                }}
              />
              <div className="relative z-10 flex flex-col items-start gap-6 p-12 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-4xl text-primary">✨</span>
                  <p className="text-2xl font-bold">ContentAI</p>
                </div>
                <h1 className="font-display text-5xl font-black leading-tight tracking-tight">
                  Where Ideas<br />Take Flight.
                </h1>
                <p className="max-w-md text-lg font-light text-gray-300">
                  Your AI content co-pilot, designed to amplify your creative process from ideation to publication.
                </p>
              </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
              <div className="flex w-full max-w-md flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <h2 className="text-foreground text-3xl font-black leading-tight tracking-[-0.033em]">
                    Welcome Back
                  </h2>
                  <p className="text-muted-foreground text-base font-normal leading-normal">
                    Log in to access your AI content co-pilot.
                  </p>
                </div>

                {/* OAuth Buttons */}
                <div className="flex w-full flex-col gap-3">
                  <Button
                    variant="outline"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-lg px-4 text-sm font-medium"
                    onClick={() => signIn?.authenticateWithRedirect({
                      strategy: 'oauth_google',
                      redirectUrl: '/dashboard',
                      redirectUrlComplete: '/auth/callback',
                    })}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path d="M22.578 12.282c0-.72-.065-1.42-.186-2.103H12v3.978h5.937c-.266 1.286-.96 2.378-2.046 3.132v2.58h3.313c1.933-1.782 3.044-4.385 3.044-7.587z" fill="#4285F4"></path>
                      <path d="M12 23c3.24 0 5.956-1.074 7.94-2.91l-3.313-2.58c-1.074.72-2.44 1.15-4.627 1.15-3.565 0-6.582-2.4-7.66-5.61H1.047v2.662C3.063 20.355 7.15 23 12 23z" fill="#34A853"></path>
                      <path d="M4.34 14.053a8.21 8.21 0 010-5.106V6.285H1.047a11.95 11.95 0 000 10.43L4.34 14.053z" fill="#FBBC05"></path>
                      <path d="M12 3.34c1.75 0 3.334.604 4.586 1.795l2.94-2.94C17.95.996 15.24 0 12 0 7.15 0 3.063 2.645 1.047 6.285l3.293 2.662C5.418 5.74 8.435 3.34 12 3.34z" fill="#EA4335"></path>
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-lg px-4 text-sm font-medium"
                    onClick={() => signIn?.authenticateWithRedirect({
                      strategy: 'oauth_github',
                      redirectUrl: '/dashboard',
                      redirectUrlComplete: '/auth/callback',
                    })}
                  >
                    <Github className="h-5 w-5" />
                    Continue with GitHub
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">OR</p>
                  <Separator />
                </div>

                {/* Login Form */}
                {error && (
                  <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                  <div className="flex flex-col flex-1">
                    <Label htmlFor="email" className="mb-2 text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 px-[15px]"
                    />
                  </div>

                  <div className="flex flex-col flex-1">
                    <Label htmlFor="password" className="mb-2 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 px-[15px] pr-10 rounded-r-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Link
                    href="/auth/forgot-password"
                    className="text-right text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot Password?
                  </Link>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-lg px-6 text-base font-semibold"
                  >
                    Log In
                  </Button>
                </form>

                {/* Sign-up Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    href="/sign-up"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
