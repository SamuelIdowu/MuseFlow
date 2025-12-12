'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Github, CheckCircle, X } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, isLoaded: isSignUpLoaded, setActive } = useSignUp();
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pending, setPending] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (isAuthLoaded && userId) {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, userId, router]);

  // Show loading state while checking auth
  if (!isAuthLoaded || (isAuthLoaded && userId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignUpLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service');
      return;
    }

    setPending(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // After successful sign up, send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPending(false);
      setVerifying(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMessage = err.errors?.[0]?.message || 'Failed to create account';

      // Handle "Session already exists" error
      if (errorMessage.toLowerCase().includes('session already exists') || err.status === 403) {
        console.log('Session already exists, redirecting to dashboard...');
        // Force hard navigation to ensure auth state is picked up
        window.location.href = '/dashboard';
        return;
      }

      setError(errorMessage);
      setPending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;

    setPending(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError('Verification failed. Please try again.');
        setPending(false);
      } else {
        await setActive({ session: completeSignUp.createdSessionId });
        // Redirect handled by middleware or router
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Verification failed');
      setPending(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="w-full max-w-md mx-auto space-y-8 p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p className="text-white/60 mt-2">
              We sent a verification code to <span className="font-medium text-white">{email}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Verification Code</label>
              <Input
                id="code"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg tracking-widest h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:border-white/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-lg bg-white text-black hover:bg-white/90 font-semibold"
              disabled={pending || !code}
            >
              {pending ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthCard mode="sign-up">
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-white">
            Create an account
          </h2>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white border-0"
            onClick={() => signUp?.authenticateWithRedirect({
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
            onClick={() => signUp?.authenticateWithRedirect({
              strategy: 'oauth_github',
              redirectUrl: '/dashboard',
              redirectUrlComplete: '/auth/callback',
            })}
          >
            <Github className="h-5 w-5 fill-white" />
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 text-white/20">
          <Separator className="bg-white/10" />
          <p className="text-xs font-medium whitespace-nowrap">OR SIGN UP WITH</p>
          <Separator className="bg-white/10" />
        </div>

        {/* Signup Form */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Input
                placeholder="First name"
                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:border-white/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Last name"
                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:border-white/20"
              />
            </div>
          </div>

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
                placeholder="Password"
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

          <div className="flex flex-col gap-2">
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:border-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60 mt-1">
            <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-400' : ''}`}>
              8+ chars
            </span>
            <span className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-400' : ''}`}>
              Uppercase
            </span>
            <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-400' : ''}`}>
              Number
            </span>
            <span className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-green-400' : ''}`}>
              Special char
            </span>
          </div>

          <div className="flex items-start gap-3 mt-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms" className="text-xs text-white/60">
              I agree to the{' '}
              <Link href="#" className="font-medium text-white hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="font-medium text-white hover:underline">
                Privacy Policy
              </Link>.
            </label>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-lg bg-white text-black hover:bg-white/90 font-semibold mt-2"
            disabled={!hasMinLength || !hasNumber || !hasUppercase || !hasSpecialChar || !passwordsMatch || !termsAccepted || pending}
          >
            {pending ? 'Creating Account...' : 'Create an account'}
          </Button>
        </form>

        <p className="text-center text-xs text-white/40">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-white hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
