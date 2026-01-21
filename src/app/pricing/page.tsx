'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function PricingPage() {
    const { isSignedIn, user } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const plans = [
        {
            name: 'Free',
            description: 'Perfect for trying out the tool',
            price: '$0',
            period: '/month',
            features: [
                '25 AI Generations/month',
                '2 Brand Profiles',
                '3 Canvas Sessions',
                '5 Saved Campaigns',
                'Community Support',
            ],
            notIncluded: [
                'Scheduled Posts',
                'Priority Support',
                'Advanced Analytics',
            ],
            buttonText: isSignedIn ? 'Current Plan' : 'Get Started',
            buttonVariant: 'outline',
            priceId: null, // Free plan logic usually internal
        },
        {
            name: 'Pro',
            description: 'For content creators and freelancers',
            price: '$9',
            period: '/month',
            features: [
                '500 AI Generations/month',
                '10 Brand Profiles',
                'Unlimited Canvas Sessions',
                'Unlimited Saved Campaigns',
                'Scheduled Posts',
                'Email Support',
            ],
            notIncluded: [
                'Priority Support',
            ],
            buttonText: 'Subscribe to Pro',
            buttonVariant: 'default',
            popular: true,
            priceId: process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO,
        },
        {
            name: 'Business',
            description: 'For teams and small agencies',
            price: '$29',
            period: '/month',
            features: [
                'Unlimited AI Generations',
                'Unlimited Brand Profiles',
                'Everything in Pro',
                'Priority Support',
                'Team Collaboration (Coming Soon)',
            ],
            notIncluded: [],
            buttonText: 'Subscribe to Business',
            buttonVariant: 'outline',
            priceId: process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_BUSINESS,
        },
    ];

    const handleFlutterwavePayment = useFlutterwave({
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: Date.now().toString(),
        amount: 0,
        currency: 'USD',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.emailAddresses[0]?.emailAddress || '',
            phone_number: '',
            name: user?.fullName || '',
        },
        customizations: {
            title: 'AI Content Tool Subscription',
            description: 'Payment for subscription',
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
        payment_plan: '0'
    } as any);

    const handleSubscribe = async (planCode: string | null | undefined) => {
        if (!isSignedIn) {
            openSignIn();
            return;
        }

        if (!planCode) {
            router.push('/dashboard');
            return;
        }

        setLoading(planCode);

        const config = {
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
            tx_ref: Date.now().toString(),
            amount: planCode === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO ? 9 : 29,
            currency: 'USD',
            payment_options: 'card,mobilemoney,ussd',
            customer: {
                email: user?.emailAddresses[0]?.emailAddress || '',
                phone_number: '',
                name: user?.fullName || '',
            },
            payment_plan: planCode,
            customizations: {
                title: `AI Content Tool - ${planCode === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO ? 'Pro' : 'Business'} Plan`,
                description: 'Monthly Subscription',
                logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
            },
        };

        handleFlutterwavePayment({
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
            },
            onClose: () => {
                setLoading(null);
            },
            ...config
        });
    };

    return (
        <div className="py-24 px-4 md:px-6">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose the plan that fits your content creation needs. Upgrade or cancel anytime.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.name} className={cn("flex flex-col relative", plan.popular && "border-primary shadow-lg scale-105 z-10")}>
                        {plan.popular && (
                            <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </span>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center text-sm">
                                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                                {plan.notIncluded.map((feature) => (
                                    <li key={feature} className="flex items-center text-sm text-muted-foreground/50">
                                        <X className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.buttonVariant as any}
                                onClick={() => handleSubscribe(plan.priceId)}
                                disabled={loading === plan.priceId}
                            >
                                {loading === plan.priceId ? 'Processing...' : plan.buttonText}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
