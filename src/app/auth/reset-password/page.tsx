'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mx-auto space-y-6 p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Password Reset Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3">
            MuseFlow now uses Google authentication for a more secure and seamless experience.
            Password reset is no longer needed.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full h-12 bg-orange-600 dark:bg-orange-500 text-white hover:bg-orange-700 dark:hover:bg-orange-600 font-semibold">
            <Link href="/sign-in">Sign In with Google</Link>
          </Button>

          <Button asChild variant="outline" className="w-full h-12 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          If you previously used email and password, please sign in with Google using the same email address.
        </p>
      </div>
    </div>
  );
}