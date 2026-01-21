'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface SubscriptionManageButtonProps {
    subscriptionId?: string | null;
    userId: string;
}

export function SubscriptionManageButton({ subscriptionId, userId }: SubscriptionManageButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;

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
            <Button variant="outline" onClick={handleCancel} disabled={loading || !subscriptionId}>
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
        </div>
    );
}
