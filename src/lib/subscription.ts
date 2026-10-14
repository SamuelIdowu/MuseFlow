import { FEATURES, getPlanTierOverride } from './featureFlags';
import { PlanTier } from './payments/types';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  status: string;
  price_id?: string | null;
  current_period_end?: string | null;
  created_at: string;
  cancel_at_period_end: boolean;
  ended_at?: string | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
}

export interface UserSubscriptionDetails {
  id: string;
  userId: string;
  planTier: PlanTier;
  status: string;
  provider?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string;
  cancelAtPeriodEnd?: boolean;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  // 1. Check environment variable plan tier override
  const override = getPlanTierOverride();
  if (override) {
    if (override === 'free') {
      return null;
    }
    return {
      id: `env_sub_${userId}`,
      user_id: userId,
      status: 'active',
      price_id: `${override}_plan`,
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      cancel_at_period_end: false,
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
    };
  }

  // FEATURE FLAG: When payments are disabled, return mock "business" subscription
  if (!FEATURES.PAYMENTS_ENABLED) {
    return {
      id: `mock_sub_${userId}`,
      user_id: userId,
      status: 'active',
      price_id: 'business_plan',
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      cancel_at_period_end: false,
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
    };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.subscriptionStatus || user.subscriptionStatus !== 'active') {
      return null;
    }

    return {
      id: user.subscriptionId || user.flutterwaveTransactionRef || `sub_${user.id}`,
      user_id: user.id,
      status: user.subscriptionStatus,
      price_id: user.planTier || user.subscriptionPlan || user.flutterwavePlanId,
      current_period_end: user.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null,
      created_at: user.createdAt.toISOString(),
      cancel_at_period_end: false,
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
    };
  } catch (err) {
    console.error('[getUserSubscription] Neon error:', err);
    return null;
  }
}

export async function getUserSubscriptionDetails(userId: string): Promise<UserSubscriptionDetails | null> {
  const override = getPlanTierOverride();
  if (override) {
    return {
      id: `env_sub_${userId}`,
      userId: userId,
      planTier: override,
      status: override === 'free' ? 'none' : 'active',
      provider: 'env-override',
      customerId: `env_cust_${userId}`,
      subscriptionId: `env_sub_${userId}`,
      currentPeriodEnd: override === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return null;

    return {
      id: user.subscriptionId || user.flutterwaveTransactionRef || `sub_${user.id}`,
      userId: user.id,
      planTier: (user.planTier || user.subscriptionPlan || 'free') as PlanTier,
      status: user.subscriptionStatus || 'none',
      provider: user.paymentProvider,
      customerId: user.customerId || user.stripeCustomerId || user.flutterwaveCustomerId,
      subscriptionId: user.subscriptionId || user.flutterwaveTransactionRef,
      currentPeriodEnd: user.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      cancelAtPeriodEnd: false,
    };
  } catch (err) {
    console.error('[getUserSubscriptionDetails] Neon error:', err);
    return null;
  }
}

export async function getSubscriptionStatus(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return 'free';
  }

  return subscription.status;
}

export async function isActiveSubscription(userId: string) {
  const subscription = await getUserSubscription(userId);
  return subscription && (subscription.status === 'active' || subscription.status === 'trialing');
}
