
import { createSupabaseServiceClient } from './supabaseServerClient';
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

export async function getUsage(userId: string, metric: UsageMetric) {
    const supabase = createSupabaseServiceClient();
    const now = new Date();

    // For monthly limits, we usually want to check the current billing period
    // But for simplicity in this MVP, we'll check the current calendar month
    // Ideally this should sync with the subscription period from the subscriptions table
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', userId)
        .eq('metric', metric)
        .eq('period_start', startOfMonth)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
        return 0;
    }

    return data?.count || 0;
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
        const supabase = createSupabaseServiceClient();

        // 1. Get user's subscription plan
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('price_id, status')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .single();

        if (subscription) {
            const { data: user } = await supabase
                .from('users')
                .select('subscription_plan')
                .eq('id', userId)
                .single();

            if (user?.subscription_plan) {
                plan = user.subscription_plan as 'free' | 'pro' | 'business';
            }
        }
    }

    const limit = PLAN_LIMITS[plan]?.[metric] ?? PLAN_LIMITS.free[metric];

    if (limit === Infinity) return true;

    const currentUsage = await getUsage(userId, metric);

    return currentUsage < limit;
}

export async function incrementUsage(userId: string, metric: UsageMetric): Promise<void> {
    const supabase = createSupabaseServiceClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    try {
        // 1. Preferred: Call atomic Postgres function to eliminate race conditions
        const { error: rpcError } = await (supabase as any).rpc('increment_user_usage', {
            p_user_id: userId,
            p_metric: metric,
            p_period_start: startOfMonth,
            p_period_end: endOfMonth,
        });

        if (!rpcError) {
            return;
        }

        console.warn('[incrementUsage] RPC call failed, falling back to atomic upsert:', rpcError.message);
    } catch (rpcErr) {
        console.warn('[incrementUsage] RPC exception, falling back to atomic upsert:', rpcErr);
    }

    // 2. Fallback: Supabase native upsert with ON CONFLICT resolution
    try {
        const { data: current } = await supabase
            .from('usage_tracking')
            .select('count')
            .eq('user_id', userId)
            .eq('metric', metric)
            .eq('period_start', startOfMonth)
            .maybeSingle();

        const newCount = (current?.count || 0) + 1;

        await supabase
            .from('usage_tracking')
            .upsert(
                {
                    user_id: userId,
                    metric,
                    count: newCount,
                    period_start: startOfMonth,
                    period_end: endOfMonth,
                },
                {
                    onConflict: 'user_id,metric,period_start',
                }
            );
    } catch (err) {
        console.error('[incrementUsage] Failed to record usage:', err);
    }
}
