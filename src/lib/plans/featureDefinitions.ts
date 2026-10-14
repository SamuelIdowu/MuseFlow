import type { PlanTier } from '@/lib/payments/types';

export type UsageMetric = 'ai_generations' | 'brand_profiles' | 'saved_campaigns' | 'canvas_sessions';

export type FeatureKey =
  | 'scheduled_posts'
  | 'canvas_sessions'
  | 'ai_generations'
  | 'brand_profiles'
  | 'saved_campaigns';

export interface FeatureMeta {
  id: FeatureKey;
  name: string;
  badge: string;
  description: string;
  minPlan: PlanTier;
  metric?: UsageMetric;
  benefits: string[];
}

export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureMeta> = {
  scheduled_posts: {
    id: 'scheduled_posts',
    name: 'Automated Post Scheduling',
    badge: 'Freelancer Pro',
    description:
      'Schedule and queue multi-channel posts across X/Twitter, LinkedIn, and newsletters with AI Best-Time optimization.',
    minPlan: 'pro',
    benefits: [
      'Automated multi-channel calendar sync',
      'AI Best-Time scheduling suggestions',
      'Background reminder notifications',
      'Unlimited scheduled posts queue',
    ],
  },
  canvas_sessions: {
    id: 'canvas_sessions',
    name: 'Unlimited Canvas Workspaces',
    badge: 'Freelancer Pro',
    description:
      'Free Starter includes up to 3 canvas workspaces. Upgrade to Freelancer Pro to create and organize unlimited canvases.',
    minPlan: 'pro',
    metric: 'canvas_sessions',
    benefits: [
      'Unlimited canvas workspaces',
      'All narrative graph templates unlocked',
      'Seamless 1-click export to editor',
      'Multi-canvas graph-to-draft compilation',
    ],
  },
  ai_generations: {
    id: 'ai_generations',
    name: '500 Monthly AI Generations',
    badge: 'Freelancer Pro',
    description:
      'You have reached your 25 monthly AI generation limit on the Free plan. Upgrade to Freelancer Pro for 500 generations each month.',
    minPlan: 'pro',
    metric: 'ai_generations',
    benefits: [
      '500 AI generations every month',
      'Research Agent deep ideation',
      'Automated multi-channel campaign generator',
      'Instant node & block expansion',
    ],
  },
  brand_profiles: {
    id: 'brand_profiles',
    name: '10 Brand Profiles',
    badge: 'Freelancer Pro',
    description:
      'Free Starter includes 2 brand profiles. Upgrade to Freelancer Pro to configure up to 10 distinct client voices.',
    minPlan: 'pro',
    metric: 'brand_profiles',
    benefits: [
      'Manage up to 10 brand voices & personas',
      'Custom tone calibration & writing samples',
      '1-click active profile switching',
    ],
  },
  saved_campaigns: {
    id: 'saved_campaigns',
    name: 'Unlimited Saved Campaigns',
    badge: 'Freelancer Pro',
    description:
      'Free Starter includes 5 saved campaigns. Upgrade to Freelancer Pro to create and save unlimited marketing campaigns.',
    minPlan: 'pro',
    metric: 'saved_campaigns',
    benefits: [
      'Unlimited campaign workflows',
      'Cross-platform asset packaging',
      'Direct calendar export',
    ],
  },
};

export interface FeatureAccessResult {
  allowed: boolean;
  feature: FeatureKey;
  plan: PlanTier;
  requiredPlan: PlanTier;
  current?: number;
  limit?: number | 'unlimited';
  reason?: string;
  featureMeta: FeatureMeta;
}

export class PlanGateError extends Error {
  code = 'PLAN_LIMIT_REACHED';
  feature: FeatureKey;
  requiredPlan: PlanTier;
  limit?: number | 'unlimited';

  constructor(feature: FeatureKey, requiredPlan: PlanTier, limit?: number | 'unlimited', message?: string) {
    super(message || `Feature ${feature} is locked. Requires ${requiredPlan} plan.`);
    this.name = 'PlanGateError';
    this.feature = feature;
    this.requiredPlan = requiredPlan;
    this.limit = limit;
  }
}
