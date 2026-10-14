'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getBillingPortalUrl, cancelUserSubscription } from '@/server/actions/billing';
import { ExternalLink } from 'lucide-react';

interface SubscriptionManageButtonProps {
  subscriptionId?: string | null;
  userId?: string;
  hasPortal?: boolean;
}

export function SubscriptionManageButton({
  subscriptionId,
  hasPortal = true,
}: SubscriptionManageButtonProps) {
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handlePortal = async () => {
    setLoadingPortal(true);
    try {
      const portalUrl = await getBillingPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        toast('Self-service portal is not configured for your payment provider. You can cancel below.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not open billing portal');
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleCancel = async () => {
    if (!subscriptionId) {
      toast.error('No active subscription found to cancel');
      return;
    }

    setLoadingCancel(true);
    try {
      const res = await cancelUserSubscription();
      if (res.success) {
        toast.success('Subscription cancelled successfully');
        window.location.reload();
      } else {
        toast.error(res.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error?.message || 'Failed to cancel subscription');
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasPortal && (
        <Button
          variant="outline"
          onClick={handlePortal}
          disabled={loadingPortal || loadingCancel}
          className="flex items-center gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          {loadingPortal ? 'Opening Portal...' : 'Manage via Portal'}
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={loadingCancel || loadingPortal || !subscriptionId}
          >
            {loadingCancel ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your active subscription? You will continue to have
              access to premium features until the end of your current billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
