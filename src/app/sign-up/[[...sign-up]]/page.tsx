'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { AlreadySignedInModal } from '@/components/auth/AlreadySignedInModal';

export default function SignUpPage() {
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Redirect or show modal if already signed in
  useEffect(() => {
    if (isAuthLoaded && userId) {
      setShowModal(true);
      // Wait a bit to show the modal before redirecting automatically
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoaded, userId, router]);

  // Show loading state while checking auth
  if (!isAuthLoaded || (isAuthLoaded && userId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        {userId && <AlreadySignedInModal isOpen={showModal} />}
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 dark:border-orange-400 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">
            {userId ? 'Redirecting to dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthCard mode="sign-up">
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Create an account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign up with Google to get started with MuseFlow
          </p>
        </div>

        {/* Google OAuth Button */}
        <Button
          variant="outline"
          className="h-12 w-full border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium"
          onClick={() => signUp?.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/dashboard',
            redirectUrlComplete: '/dashboard',
          })}
          disabled={!isSignUpLoaded}
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
