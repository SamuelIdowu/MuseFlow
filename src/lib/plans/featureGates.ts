import { PlanTier } from '@/lib/payments/types';
import { PLANS } from '@/lib/payments/config';
import { PLAN_LIMITS, getUsage, UsageMetric } from '@/lib/usage';
import { FEATURES, getPlanTierOverride } from '@/lib/featureFlags';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { canvasSessions } from '@/db/schema/canvas';
import { profiles } from '@/db/schema/profiles';
import { eq, count } from 'drizzle-orm';

import {
  FeatureKey,
  FeatureMeta,
  FEATURE_DEFINITIONS,
  FeatureAccessResult,
  PlanGateError,
} from './featureDefinitions';

export * from './featureDefinitions';

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

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        planTier: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user) return 'free';

    const tier = (user.planTier || user.subscriptionPlan || 'free') as PlanTier;
    const status = user.subscriptionStatus || 'none';

    if (tier !== 'free' && (status === 'active' || status === 'trialing')) {
      return tier;
    }

    return 'free';
  } catch (err) {
    console.error('[getUserEffectivePlan] Neon error:', err);
    return 'free';
  }
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
    let currentCount = 0;

    try {
      const [result] = await db
        .select({ value: count() })
        .from(canvasSessions)
        .where(eq(canvasSessions.userId, userId));
      currentCount = result?.value || 0;
    } catch (err) {
      console.error('[checkFeatureAccess canvas_sessions] Neon error:', err);
    }

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
    let currentCount = 0;

    try {
      const [result] = await db
        .select({ value: count() })
        .from(profiles)
        .where(eq(profiles.userId, userId));
      currentCount = result?.value || 0;
    } catch (err) {
      console.error('[checkFeatureAccess brand_profiles] Neon error:', err);
    }

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
