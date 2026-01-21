
import { createSupabaseServiceClient } from './supabaseServerClient';
import { Database } from './database.types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export async function getUserSubscription(userId: string) {
    const supabase = createSupabaseServiceClient();

    // Query the `users` table as the source of truth for Flutterwave subscriptions
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (!user || !user.subscription_status || user.subscription_status !== 'active') {
        return null; // Return null if no active subscription found
    }

    // Map the user data to a Subscription-like object to maintain compatibility
    // This allows the frontend to consume it without massive refactoring, 
    // though `price_id` will now hold the Flutterwave Plan ID
    const subscription: Subscription = {
        id: user.flutterwave_transaction_ref || `sub_${user.id}`, // Fallback ID
        user_id: user.id,
        status: user.subscription_status,
        price_id: user.flutterwave_plan_id,
        current_period_end: user.current_period_end,
        created_at: user.created_at, // Approximate
        cancel_at_period_end: false, // Default
        ended_at: null,
        cancel_at: null,
        canceled_at: null,
        trial_start: null,
        trial_end: null
    };

    return subscription;
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
