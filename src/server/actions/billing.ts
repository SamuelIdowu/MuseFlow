'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';
import {
  getPaymentProvider,
  PlanTier,
  BillingCycle,
  CheckoutResult,
} from '@/lib/payments';

export async function createSubscriptionCheckout(
  planTier: 'pro' | 'studio' | 'business',
  billingCycle: BillingCycle = 'monthly',
  returnPath: string = '/dashboard/settings/billing'
): Promise<CheckoutResult> {
  const clerkUser = await currentUser();
  const supabaseUserId = await getAuthenticatedSupabaseUserId();

  if (!clerkUser || !supabaseUserId) {
    throw new Error('Unauthorized');
  }

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!userEmail) {
    throw new Error('User email not found');
  }

  const userName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const provider = getPaymentProvider();

  // Normalize return paths
  const successUrl = returnPath.startsWith('http')
    ? returnPath
    : `${baseUrl}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}?billing=success`;
  const cancelUrl = returnPath.startsWith('http')
    ? returnPath
    : `${baseUrl}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}?billing=cancel`;

  return await provider.createCheckout({
    userId: supabaseUserId,
    userEmail,
    userName,
    planTier,
    billingCycle,
    successUrl,
    cancelUrl,
  });
}

export async function getBillingPortalUrl(returnPath: string = '/dashboard/settings/billing'): Promise<string | null> {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  if (!supabaseUserId) throw new Error('Unauthorized');

  const supabase = createSupabaseServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUserId)
    .single();

  if (!user) return null;

  const providerName = user.payment_provider || undefined;
  const provider = getPaymentProvider(providerName);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnUrl = `${baseUrl}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;

  const customerId = user.customer_id || user.stripe_customer_id || user.flutterwave_customer_id || undefined;
  const subscriptionId = user.subscription_id || user.flutterwave_transaction_ref || undefined;

  return await provider.getPortalUrl({
    customerId,
    subscriptionId,
    userId: supabaseUserId,
    returnUrl,
  });
}

export async function cancelUserSubscription(reason?: string): Promise<{ success: boolean; message?: string }> {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  if (!supabaseUserId) throw new Error('Unauthorized');

  const supabase = createSupabaseServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUserId)
    .single();

  if (!user) throw new Error('User not found');

  const subscriptionId = user.subscription_id || user.flutterwave_transaction_ref;
  if (!subscriptionId) {
    throw new Error('No active subscription found');
  }

  const providerName = user.payment_provider || undefined;
  const provider = getPaymentProvider(providerName);

  if (provider.cancelSubscription) {
    await provider.cancelSubscription({
      subscriptionId,
      userId: supabaseUserId,
      reason,
    });
  }

  // Update subscription status in DB
  await supabase
    .from('users')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', supabaseUserId);

  return { success: true, message: 'Subscription canceled successfully' };
}
