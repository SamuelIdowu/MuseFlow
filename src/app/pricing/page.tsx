'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import SubscribeButton from './SubscribeButton';
import { PlanTier } from '@/lib/payments/types';

export default function PricingPage() {
  const { isSignedIn } = useUser();

  const plans = [
    {
      id: 'free' as PlanTier,
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
      amount: 0,
    },
    {
      id: 'pro' as PlanTier,
      name: 'Pro',
      description: 'For content creators and freelancers',
      price: '$19',
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
      amount: 19,
    },
    {
      id: 'business' as PlanTier,
      name: 'Business',
      description: 'For teams and small agencies',
      price: '$49',
      period: '/month',
      features: [
        'Unlimited AI Generations',
        'Unlimited Brand Profiles',
        'Everything in Pro',
        'Up to 5 Team Members',
        'Priority Support',
        'Custom Branding & Analytics',
      ],
      notIncluded: [],
      buttonText: 'Subscribe to Business',
      buttonVariant: 'outline',
      popular: false,
      amount: 49,
    },
  ];

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
          <Card
            key={plan.name}
            className={cn(
              'flex flex-col relative',
              plan.popular && 'border-primary shadow-lg scale-105 z-10'
            )}
          >
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
              <SubscribeButton
                planTier={plan.id}
                buttonText={plan.buttonText}
                variant={plan.buttonVariant as any}
                className="w-full"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
