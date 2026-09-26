import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';
import { PlanTier } from '@/lib/payments/types';
import { PLANS } from '@/lib/payments/config';
import { PLAN_LIMITS, getUsage, UsageMetric } from '@/lib/usage';
import { FEATURES, getPlanTierOverride } from '@/lib/featureFlags';

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

/**
 * Resolves the effective plan tier for a user.
 */
export async function getUserEffectivePlan(userId: string): Promise<PlanTier> {
  // 1. Check if an environment variable overrides the plan tier globally
  const override = getPlanTierOverride();
  if (override) {
    return override;
  }

  // If plan limits enforcement is disabled globally, treat as business
  if (!FEATURES.ENFORCE_PLAN_LIMITS && !FEATURES.PAYMENTS_ENABLED) {
    return 'business';
  }

  const supabase = createSupabaseServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('plan_tier, subscription_status, subscription_plan')
    .eq('id', userId)
    .maybeSingle();

  if (!user) return 'free';

  const tier = (user.plan_tier || user.subscription_plan || 'free') as PlanTier;
  const status = user.subscription_status || 'none';

  if (tier !== 'free' && (status === 'active' || status === 'trialing')) {
    return tier;
  }

  return 'free';
}

/**
 * Checks whether a user can access a specific feature or quota.
 */
export async function checkFeatureAccess(
  userId: string,
  feature: FeatureKey
): Promise<FeatureAccessResult> {
  const meta = FEATURE_DEFINITIONS[feature];
  const effectivePlan = await getUserEffectivePlan(userId);

  // Studio and Business tiers have full access to all features
  if (effectivePlan === 'studio' || effectivePlan === 'business') {
    return {
      allowed: true,
      feature,
      plan: effectivePlan,
      requiredPlan: meta.minPlan,
      limit: 'unlimited',
      featureMeta: meta,
    };
  }

  // 1. Hard Feature Gates (boolean capability)
  if (feature === 'scheduled_posts') {
    const isAllowed = PLANS[effectivePlan].limits.scheduledPosts === true;
    return {
      allowed: isAllowed,
      feature,
      plan: effectivePlan,
      requiredPlan: 'pro',
      reason: isAllowed
        ? undefined
        : 'Post scheduling is a Freelancer Pro feature. Upgrade to schedule posts and sync calendars.',
      featureMeta: meta,
    };
  }

  // 2. Quota / Threshold Gates
  if (feature === 'canvas_sessions') {
    const limit = effectivePlan === 'free' ? 3 : Infinity;
    const supabase = createSupabaseServiceClient();
    const { count } = await supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    const isAllowed = currentCount < limit;

    return {
      allowed: isAllowed,
      feature,
      plan: effectivePlan,
      requiredPlan: 'pro',
      current: currentCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      reason: isAllowed
        ? undefined
        : `You have reached the ${limit} canvas limit on the Free plan. Upgrade to Pro for unlimited canvases.`,
      featureMeta: meta,
    };
  }

  if (feature === 'brand_profiles') {
    const limit = effectivePlan === 'free' ? 2 : effectivePlan === 'pro' ? 10 : Infinity;
    const supabase = createSupabaseServiceClient();
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    const isAllowed = currentCount < limit;

    return {
      allowed: isAllowed,
      feature,
      plan: effectivePlan,
      requiredPlan: 'pro',
      current: currentCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      reason: isAllowed
        ? undefined
        : `You have reached the ${limit} brand profile limit. Upgrade to Pro to add more profiles.`,
      featureMeta: meta,
    };
  }

  if (feature === 'ai_generations') {
    const limit = PLAN_LIMITS[effectivePlan]?.ai_generations || 25;
    if (limit === Infinity) {
      return {
        allowed: true,
        feature,
        plan: effectivePlan,
        requiredPlan: 'pro',
        limit: 'unlimited',
        featureMeta: meta,
      };
    }

    const currentUsage = await getUsage(userId, 'ai_generations');
    const isAllowed = currentUsage < limit;

    return {
      allowed: isAllowed,
      feature,
      plan: effectivePlan,
      requiredPlan: 'pro',
      current: currentUsage,
      limit,
      reason: isAllowed
        ? undefined
        : `You have used all ${limit} monthly AI generations on the Free plan. Upgrade to Pro for 500 generations.`,
      featureMeta: meta,
    };
  }

  if (feature === 'saved_campaigns') {
    const limit = effectivePlan === 'free' ? 5 : Infinity;
    const currentUsage = await getUsage(userId, 'saved_campaigns');
    const isAllowed = limit === Infinity || currentUsage < limit;

    return {
      allowed: isAllowed,
      feature,
      plan: effectivePlan,
      requiredPlan: 'pro',
      current: currentUsage,
      limit: limit === Infinity ? 'unlimited' : limit,
      reason: isAllowed
        ? undefined
        : `You have reached the ${limit} saved campaigns limit on the Free plan.`,
      featureMeta: meta,
    };
  }

  return {
    allowed: true,
    feature,
    plan: effectivePlan,
    requiredPlan: meta.minPlan,
    featureMeta: meta,
  };
}

/**
 * Asserts that a feature is accessible, throwing PlanGateError if not.
 */
export async function assertFeatureAllowed(userId: string, feature: FeatureKey): Promise<void> {
  const result = await checkFeatureAccess(userId, feature);
  if (!result.allowed) {
    throw new PlanGateError(
      feature,
      result.requiredPlan,
      result.limit,
      result.reason
    );
  }
}
