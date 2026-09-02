import { PlanConfig, PlanTier } from './types';

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for trying out the tool and personal experimentation.',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '25 AI Generations/month',
      '2 Brand Profiles',
      '3 Canvas Sessions',
      '5 Saved Campaigns',
      'Community Support',
    ],
    limits: {
      generationsPerMonth: 25,
      brandProfiles: 2,
      canvasSessions: 3,
      savedCampaigns: 5,
      teamMembers: 1,
      customBranding: false,
      scheduledPosts: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Freelancer Pro',
    description: 'For active content creators, solopreneurs, and freelancers.',
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      '500 AI Generations/month',
      '10 Brand Profiles',
      'Unlimited Canvas Sessions',
      'Unlimited Saved Campaigns',
      'Scheduled Posts',
      'Custom Branding',
      'Standard Support',
    ],
    limits: {
      generationsPerMonth: 500,
      brandProfiles: 10,
      canvasSessions: 'unlimited',
      savedCampaigns: 'unlimited',
      teamMembers: 1,
      customBranding: true,
      scheduledPosts: true,
    },
    productIds: {
      paystack: {
        monthly: process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE || process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO,
        yearly: process.env.PAYSTACK_PRO_YEARLY_PLAN_CODE,
      },
      paddle: {
        monthly: process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
        yearly: process.env.PADDLE_PRO_YEARLY_PRICE_ID,
      },
      dodo: {
        monthly: process.env.DODO_PRO_MONTHLY_PRODUCT_ID,
        yearly: process.env.DODO_PRO_YEARLY_PRODUCT_ID,
      },
      polar: {
        monthly: process.env.POLAR_PRO_MONTHLY_PRODUCT_ID,
        yearly: process.env.POLAR_PRO_YEARLY_PRODUCT_ID,
      },
      creem: {
        monthly: process.env.CREEM_PRO_MONTHLY_PRODUCT_ID,
        yearly: process.env.CREEM_PRO_YEARLY_PRODUCT_ID,
      },
      stripe: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      },
      flutterwave: {
        monthly: process.env.FLUTTERWAVE_PRO_MONTHLY_PLAN_ID || process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO,
        yearly: process.env.FLUTTERWAVE_PRO_YEARLY_PLAN_ID,
      },
    },
  },
  studio: {
    id: 'studio',
    name: 'Studio & Agency',
    description: 'For growing teams, high-volume creators, and agencies.',
    priceMonthly: 49,
    priceYearly: 490,
    features: [
      'Unlimited AI Generations',
      'Unlimited Brand Profiles',
      'Unlimited Canvas Sessions',
      'Unlimited Saved Campaigns',
      'Up to 5 Team Members',
      'Priority Support',
      'Custom Branding & Analytics',
    ],
    limits: {
      generationsPerMonth: 'unlimited',
      brandProfiles: 'unlimited',
      canvasSessions: 'unlimited',
      savedCampaigns: 'unlimited',
      teamMembers: 5,
      customBranding: true,
      scheduledPosts: true,
      prioritySupport: true,
    },
    productIds: {
      paystack: {
        monthly: process.env.PAYSTACK_STUDIO_MONTHLY_PLAN_CODE || process.env.NEXT_PUBLIC_PAYSTACK_PLAN_BUSINESS,
        yearly: process.env.PAYSTACK_STUDIO_YEARLY_PLAN_CODE,
      },
      paddle: {
        monthly: process.env.PADDLE_STUDIO_MONTHLY_PRICE_ID,
        yearly: process.env.PADDLE_STUDIO_YEARLY_PRICE_ID,
      },
      dodo: {
        monthly: process.env.DODO_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.DODO_STUDIO_YEARLY_PRODUCT_ID,
      },
      polar: {
        monthly: process.env.POLAR_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.POLAR_STUDIO_YEARLY_PRODUCT_ID,
      },
      creem: {
        monthly: process.env.CREEM_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.CREEM_STUDIO_YEARLY_PRODUCT_ID,
      },
      stripe: {
        monthly: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID,
      },
      flutterwave: {
        monthly: process.env.FLUTTERWAVE_BUSINESS_MONTHLY_PLAN_ID || process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_BUSINESS,
        yearly: process.env.FLUTTERWAVE_BUSINESS_YEARLY_PLAN_ID,
      },
    },
  },
  business: {
    id: 'business',
    name: 'Business & Agency',
    description: 'For growing teams, high-volume creators, and agencies.',
    priceMonthly: 49,
    priceYearly: 490,
    features: [
      'Unlimited AI Generations',
      'Unlimited Brand Profiles',
      'Unlimited Canvas Sessions',
      'Unlimited Saved Campaigns',
      'Up to 5 Team Members',
      'Priority Support',
      'Custom Branding & Analytics',
    ],
    limits: {
      generationsPerMonth: 'unlimited',
      brandProfiles: 'unlimited',
      canvasSessions: 'unlimited',
      savedCampaigns: 'unlimited',
      teamMembers: 5,
      customBranding: true,
      scheduledPosts: true,
      prioritySupport: true,
    },
    productIds: {
      paystack: {
        monthly: process.env.PAYSTACK_STUDIO_MONTHLY_PLAN_CODE || process.env.NEXT_PUBLIC_PAYSTACK_PLAN_BUSINESS,
        yearly: process.env.PAYSTACK_STUDIO_YEARLY_PLAN_CODE,
      },
      paddle: {
        monthly: process.env.PADDLE_STUDIO_MONTHLY_PRICE_ID,
        yearly: process.env.PADDLE_STUDIO_YEARLY_PRICE_ID,
      },
      dodo: {
        monthly: process.env.DODO_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.DODO_STUDIO_YEARLY_PRODUCT_ID,
      },
      polar: {
        monthly: process.env.POLAR_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.POLAR_STUDIO_YEARLY_PRODUCT_ID,
      },
      creem: {
        monthly: process.env.CREEM_STUDIO_MONTHLY_PRODUCT_ID,
        yearly: process.env.CREEM_STUDIO_YEARLY_PRODUCT_ID,
      },
      stripe: {
        monthly: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID,
      },
      flutterwave: {
        monthly: process.env.FLUTTERWAVE_BUSINESS_MONTHLY_PLAN_ID || process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_BUSINESS,
        yearly: process.env.FLUTTERWAVE_BUSINESS_YEARLY_PLAN_ID,
      },
    },
  },
};
