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
} from "@/components/ui/alert-dialog";

interface SubscriptionManageButtonProps {
    subscriptionId?: string | null;
    userId: string;
}

export function SubscriptionManageButton({ subscriptionId, userId }: SubscriptionManageButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!subscriptionId) {
            toast.error("No active subscription found to cancel");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/flutterwave/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription_id: subscriptionId,
                    user_id: userId
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            toast.success('Subscription cancelled successfully');
            window.location.reload();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error('Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={loading || !subscriptionId}>
                        {loading ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel your active subscription? You will continue to have access to premium features until the end of your current billing cycle.
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
