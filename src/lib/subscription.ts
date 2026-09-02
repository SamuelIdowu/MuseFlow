import { createSupabaseServiceClient } from './supabaseServerClient';
import { Database } from './database.types';
import { FEATURES } from './featureFlags';
import { PlanTier } from './payments/types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

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

export async function getUserSubscription(userId: string) {
  // FEATURE FLAG: When payments are disabled, return mock "business" subscription
  if (!FEATURES.PAYMENTS_ENABLED) {
    const mockSubscription: Subscription = {
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
    return mockSubscription;
  }

  const supabase = createSupabaseServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user || !user.subscription_status || user.subscription_status !== 'active') {
    return null;
  }

  const subscription: Subscription = {
    id: user.subscription_id || user.flutterwave_transaction_ref || `sub_${user.id}`,
    user_id: user.id,
    status: user.subscription_status,
    price_id: user.plan_tier || user.subscription_plan || user.flutterwave_plan_id,
    current_period_end: user.current_period_end,
    created_at: user.created_at,
    cancel_at_period_end: false,
    ended_at: null,
    cancel_at: null,
    canceled_at: null,
    trial_start: null,
    trial_end: null,
  };

  return subscription;
}

export async function getUserSubscriptionDetails(userId: string): Promise<UserSubscriptionDetails | null> {
  const supabase = createSupabaseServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) return null;

  return {
    id: user.subscription_id || user.flutterwave_transaction_ref || `sub_${user.id}`,
    userId: user.id,
    planTier: (user.plan_tier || user.subscription_plan || 'free') as PlanTier,
    status: user.subscription_status || 'none',
    provider: user.payment_provider,
    customerId: user.customer_id || user.stripe_customer_id || user.flutterwave_customer_id,
    subscriptionId: user.subscription_id || user.flutterwave_transaction_ref,
    currentPeriodEnd: user.current_period_end,
    createdAt: user.created_at,
    cancelAtPeriodEnd: false,
  };
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
