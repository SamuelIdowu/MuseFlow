'use client';

import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';


import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export function PricingSection() {
    const { isSignedIn, user } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: '/month',
            description: 'Perfect for trying out the tool.',
            features: [
                '25 AI Generations/month',
                '2 Brand Profiles',
                '3 Canvas Sessions',
                '5 Saved Campaigns',
                'Community Support',
            ],
            cta: isSignedIn ? 'Go to Dashboard' : 'Get Started',
            href: isSignedIn ? '/dashboard' : '/sign-up',
            variant: 'outline',
            popular: false,
            priceId: null,
        },
        {
            name: 'Pro',
            price: '$9',
            period: '/month',
            description: 'For content creators and freelancers.',
            features: [
                '500 AI Generations/month',
                '10 Brand Profiles',
                'Unlimited Canvas Sessions',
                'Unlimited Saved Campaigns',
                'Scheduled Posts',
                'Email Support',
            ],
            cta: 'Upgrade to Pro',
            href: null,
            variant: 'default',
            popular: true,
            icon: Zap,
            priceId: process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO,
        },
        {
            name: 'Business',
            price: '$29',
            period: '/month',
            description: 'For teams and small agencies.',
            features: [
                'Unlimited AI Generations',
                'Unlimited Brand Profiles',
                'Everything in Pro',
                'Priority Support',
                'Team Collaboration (Coming Soon)',
            ],
            cta: 'Subscribe to Business',
            href: null,
            variant: 'outline',
            popular: false,
            icon: Building2,
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
        payment_plan: '0' // Placeholder, overlaid dynamically
    } as any);


    const handleSubscribe = async (planCode: string | null | undefined, href: string | null) => {
        if (href) {
            router.push(href);
            return;
        }

        if (!isSignedIn) {
            toast.error("Please sign in to subscribe");
            openSignIn();
            return;
        }

        if (!planCode) {
            toast.error("Plan not configured");
            return;
        }

        setLoading(planCode);

        // Dynamic config for specific click
        const config = {
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
            tx_ref: Date.now().toString(),
            amount: planCode === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO ? 9 : 29, // $9 or $29
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
                closePaymentModal(); // this will close the modal programmatically

                if (response.status === "successful") {
                    toast.loading("Verifying payment...");
                    try {
                        const verifyRes = await fetch('/api/flutterwave/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ transaction_id: response.transaction_id })
                        });

                        if (verifyRes.ok) {
                            toast.dismiss();
                            toast.success("Subscription activated!");
                            window.location.href = '/dashboard';
                        } else {
                            toast.dismiss();
                            toast.error("Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.dismiss();
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
        <section id="pricing" className="py-24 relative overflow-hidden bg-slate-950 text-slate-50">
            {/* Background Gradients/Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-emerald-400">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Choose the plan that fits your content needs. scalable as you grow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative group rounded-3xl p-8 border transition-all duration-300",
                                "bg-slate-900/50 backdrop-blur-xl",
                                plan.popular
                                    ? "border-orange-500/30 shadow-2xl shadow-orange-500/10 scale-105 z-10"
                                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-slate-100">{plan.name}</h3>
                                    {plan.icon && <div className="p-2 rounded-lg bg-slate-800 text-slate-300"><plan.icon className="w-5 h-5" /></div>}
                                </div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-slate-500 text-sm">{plan.period}</span>
                                </div>
                                <p className="text-slate-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-8 space-y-4">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                        <Check className={cn("w-5 h-5 shrink-0", plan.popular ? "text-orange-500" : "text-emerald-500")} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-12 rounded-xl text-base font-semibold transition-all",
                                    plan.popular
                                        ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/25 border-0"
                                        : "bg-slate-800 hover:border-slate-700 text-white border border-slate-700"
                                )}
                                variant={plan.variant as any}
                                onClick={() => handleSubscribe(plan.priceId, plan.href)}
                                disabled={loading === plan.priceId}
                            >
                                {loading === plan.priceId ? 'Processing...' : plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
