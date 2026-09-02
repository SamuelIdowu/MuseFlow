'use client';

import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FEATURES } from '@/lib/featureFlags';
import { createSubscriptionCheckout } from '@/server/actions/billing';
import { PlanTier } from '@/lib/payments/types';

export function PricingSection() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const plans = [
    {
      id: 'free' as PlanTier,
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out the tool and experimenting.',
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
    },
    {
      id: 'pro' as PlanTier,
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For active content creators and freelancers.',
      features: [
        '500 AI Generations/month',
        '10 Brand Profiles',
        'Unlimited Canvas Sessions',
        'Unlimited Saved Campaigns',
        'Scheduled Posts',
        'Custom Branding',
        'Email Support',
      ],
      cta: 'Upgrade to Pro',
      href: null,
      variant: 'default',
      popular: true,
      icon: Zap,
    },
    {
      id: 'business' as PlanTier,
      name: 'Business',
      price: '$49',
      period: '/month',
      description: 'For teams, power creators, and small agencies.',
      features: [
        'Unlimited AI Generations',
        'Unlimited Brand Profiles',
        'Everything in Pro',
        'Up to 5 Team Members',
        'Priority Support',
        'Custom Branding & Analytics',
      ],
      cta: 'Subscribe to Business',
      href: null,
      variant: 'outline',
      popular: false,
      icon: Building2,
    },
  ];

  const handleSubscribe = async (tier: PlanTier, href: string | null) => {
    // FEATURE FLAG: When payments are disabled, redirect to dashboard
    if (!FEATURES.PAYMENTS_ENABLED) {
      if (href) {
        router.push(href);
        return;
      }
      if (!isSignedIn) {
        toast.error('Please sign in to continue');
        openSignIn();
        return;
      }
      toast.success('All features are available! Redirecting to dashboard...');
      router.push('/dashboard');
      return;
    }

    if (href) {
      router.push(href);
      return;
    }

    if (!isSignedIn) {
      toast.error('Please sign in to subscribe');
      openSignIn();
      return;
    }

    if (tier === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoadingTier(tier);
    const toastId = toast.loading('Creating checkout session...');

    try {
      const result = await createSubscriptionCheckout(
        tier,
        'monthly',
        '/dashboard/settings/billing'
      );

      toast.dismiss(toastId);

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error('Could not generate checkout session');
        setLoadingTier(null);
      }
    } catch (err: any) {
      console.error('[Subscription Checkout Error]', err);
      toast.dismiss(toastId);
      toast.error(err?.message || 'Failed to initialize payment gateway');
      setLoadingTier(null);
    }
  };

  return (
    <div id="pricing" className="py-24 relative overflow-hidden bg-slate-50/60 dark:bg-slate-950/80 text-foreground border-t border-border/50 transition-colors">
      {/* Background Gradients/Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground font-space-grotesk">
            Invest in Your Creative Output
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Choose the plan that fits your workflow. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative group rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between',
                'bg-card text-card-foreground shadow-sm hover:shadow-md',
                plan.popular
                  ? 'border-orange-500/60 dark:border-orange-500/40 shadow-xl shadow-orange-500/10 md:scale-105 z-10 ring-1 ring-orange-500/20 bg-white dark:bg-slate-900/95'
                  : 'border-border/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 tracking-wide uppercase">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-foreground font-space-grotesk">{plan.name}</h3>
                    {plan.icon && (
                      <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <plan.icon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl sm:text-5xl font-bold text-foreground font-space-grotesk">{plan.price}</span>
                    <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-8 space-y-3.5 pt-4 border-t border-border/50">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        plan.popular ? "bg-orange-500/15 text-orange-600 dark:text-orange-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      )}>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className={cn(
                  'w-full h-12 rounded-xl text-sm font-semibold transition-all shadow-sm',
                  plan.popular
                    ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-foreground text-background hover:bg-foreground/90 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                )}
                variant={plan.variant as any}
                onClick={() => handleSubscribe(plan.id, plan.href)}
                disabled={loadingTier === plan.id}
              >
                {loadingTier === plan.id ? 'Redirecting...' : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
