'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, CheckCircle2 } from 'lucide-react';

interface AlreadySignedInModalProps {
  isOpen: boolean;
}

export function AlreadySignedInModal({ isOpen }: AlreadySignedInModalProps) {
  const router = useRouter();
  const { signOut, session } = useClerk();

  const handleGoToDashboard = async () => {
    try {
      // Force refresh the token to fix potential client/server session desync
      if (session) {
        await session.getToken({ skipCache: true });
        // Give the browser a moment to settle cookies before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Use router.push for client-side navigation which often handles Clerk state better
      // than a hard window.location.href in Next.js apps
      router.push('/dashboard');
      
      // Fallback: If router.push doesn't trigger a change (e.g. already on the page path)
      // or if it fails, we can use a slightly delayed href as a last resort
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }, 2000);
    } catch (e) {
      console.error('Failed to refresh token:', e);
      window.location.href = '/dashboard';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      window.location.href = '/';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] border-orange-100 dark:border-orange-900/30">
        <DialogHeader className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-2xl font-bold">You're already signed in</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            You're currently logged into your account. Would you like to go to your dashboard or sign out to use a different account?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            className="w-full sm:flex-1 h-11 border-gray-200 dark:border-gray-700"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button
            className="w-full sm:flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 transition-all duration-200"
            onClick={handleGoToDashboard}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
