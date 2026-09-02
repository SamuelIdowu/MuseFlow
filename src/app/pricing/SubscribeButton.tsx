'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FEATURES } from '@/lib/featureFlags';
import { createSubscriptionCheckout } from '@/server/actions/billing';
import { BillingCycle, PlanTier } from '@/lib/payments/types';

interface SubscribeButtonProps {
  planTier: 'free' | 'pro' | 'studio' | 'business';
  billingCycle?: BillingCycle;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonText?: string;
}

export default function SubscribeButton({
  planTier,
  billingCycle = 'monthly',
  className,
  variant = 'default',
  buttonText = 'Subscribe',
}: SubscribeButtonProps) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    // FEATURE FLAG: When payments are disabled, redirect to dashboard
    if (!FEATURES.PAYMENTS_ENABLED) {
      if (!isSignedIn) {
        openSignIn();
        return;
      }
      toast.success('All features are available! Redirecting to dashboard...');
      router.push('/dashboard');
      return;
    }

    if (!isSignedIn) {
      toast.error('Please sign in to subscribe');
      openSignIn();
      return;
    }

    if (planTier === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Preparing checkout...');

    try {
      const result = await createSubscriptionCheckout(
        planTier,
        billingCycle,
        '/dashboard/settings/billing'
      );

      toast.dismiss(toastId);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error('Could not generate checkout link');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.dismiss(toastId);
      toast.error(error?.message || 'Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      className={className}
      variant={variant}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? 'Redirecting...' : buttonText}
    </Button>
  );
}
