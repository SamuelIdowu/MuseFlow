'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import toast from 'react-hot-toast';

interface SubscribeButtonProps {
    planId: string | null;
    amount: number;
    planName: string;
    className?: string; // For styling
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    buttonText?: string;
    isPopular?: boolean;
}

export default function SubscribeButton({ planId, amount, planName, className, variant = "default", buttonText = "Subscribe" }: SubscribeButtonProps) {
    const { isSignedIn, user } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Configuration for Flutterwave
    // Note: We create this even if planId is null, but we won't use it if planId is null
    const config = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: `tx-${Date.now()}-${planId}`,
        amount: amount,
        currency: 'USD',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.emailAddresses[0]?.emailAddress || '',
            phone_number: '',
            name: user?.fullName || '',
        },
        ...(planId ? { payment_plan: planId } : {}),
        customizations: {
            title: `AI Content Tool - ${planName} Plan`,
            description: 'Monthly Subscription',
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
    };

    console.log("Flutterwave Config:", config);
    if (amount <= 0) {
        console.warn('⚠️ WARNING: Amount is 0 or negative. Flutterwave will reject this payment.');
    }

    // Initialize the hook with the specific config for THIS button
    const handlePayment = useFlutterwave(config as any);

    const handleSubscribe = async () => {
        if (!isSignedIn) {
            openSignIn();
            return;
        }

        // Handle Free Plan or case where no plan ID is present or amount is 0
        // Flutterwave does NOT accept amount = 0, even in test mode
        if (!planId || planId === '' || amount <= 0) {
            console.log('Free plan detected - redirecting to dashboard');
            toast.success('Welcome! Accessing dashboard...');
            router.push('/dashboard');
            return;
        }

        // Additional safety check before payment
        if (amount <= 0) {
            console.error('Invalid amount:', amount);
            toast.error('Invalid subscription amount. Please contact support.');
            return;
        }

        console.log('Initiating payment with amount:', amount, 'planId:', planId);
        setLoading(true);

        try {
            handlePayment({
                callback: async (response) => {
                    closePaymentModal();
                    if (response.status === "successful") {
                        const toastId = toast.loading("Verifying payment...");
                        try {
                            const verifyRes = await fetch('/api/flutterwave/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ transaction_id: response.transaction_id })
                            });

                            if (verifyRes.ok) {
                                toast.dismiss(toastId);
                                toast.success("Subscription activated!");
                                window.location.href = '/dashboard';
                            } else {
                                toast.dismiss(toastId);
                                toast.error("Payment verification failed.");
                            }
                        } catch (err) {
                            console.error(err);
                            toast.dismiss(toastId);
                            toast.error("Verification error");
                        }
                    } else {
                        toast.error("Payment failed. Please try again.");
                    }
                    setLoading(false);
                },
                onClose: () => {
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error("Payment initialization error:", error);
            setLoading(false);
            toast.error("Could not initialize payment.");
        }
    };

    return (
        <Button
            className={className}
            variant={variant}
            onClick={handleSubscribe}
            disabled={loading}
        >
            {loading ? 'Processing...' : buttonText}
        </Button>
    );
}
