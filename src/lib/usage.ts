import { FEATURES, getPlanTierOverride } from './featureFlags';

export type UsageMetric = 'ai_generations' | 'brand_profiles' | 'saved_campaigns' | 'canvas_sessions';

export const PLAN_LIMITS = {
    free: {
        ai_generations: 25,
        brand_profiles: 2,
        saved_campaigns: 5,
        canvas_sessions: 3,
    },
    pro: {
        ai_generations: 500,
        brand_profiles: 10,
        saved_campaigns: Infinity,
        canvas_sessions: Infinity,
    },
    business: {
        ai_generations: Infinity,
        brand_profiles: Infinity,
        saved_campaigns: Infinity,
        canvas_sessions: Infinity,
    },
};

import {
    getUsageFromDb,
    incrementUsageInDb,
    getUserSubscriptionPlanFromDb,
} from '@/db/queries/billing';

export async function getUsage(userId: string, metric: UsageMetric): Promise<number> {
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        return await getUsageFromDb(userId, metric, startOfMonthDate);
    } catch (err) {
        console.error('[getUsage] Neon error:', err);
        return 0;
    }
}

export async function checkUsageLimit(userId: string, metric: UsageMetric): Promise<boolean> {
    const override = getPlanTierOverride();

    // FEATURE FLAG: When payments are disabled AND no override is active AND limits are not enforced, bypass all usage limits
    if (!override && !FEATURES.PAYMENTS_ENABLED && !FEATURES.ENFORCE_PLAN_LIMITS) {
        return true; // Allow unlimited usage
    }

    let plan: 'free' | 'pro' | 'business' = 'free';

    if (override) {
        plan = override === 'studio' ? 'business' : override;
    } else {
        try {
            plan = await getUserSubscriptionPlanFromDb(userId);
        } catch (err) {
            console.error('[checkUsageLimit] Neon error:', err);
        }
    }

    const limit = PLAN_LIMITS[plan]?.[metric] ?? PLAN_LIMITS.free[metric];

    if (limit === Infinity) return true;

    const currentUsage = await getUsage(userId, metric);

    return currentUsage < limit;
}

export async function incrementUsage(userId: string, metric: UsageMetric): Promise<void> {
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
        await incrementUsageInDb(userId, metric, startOfMonthDate, endOfMonthDate);
    } catch (err) {
        console.error('[incrementUsage] Neon error:', err);
    }
}
