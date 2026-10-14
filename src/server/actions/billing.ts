'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedUserId } from '@/lib/authUtils';
import {
  getPaymentProvider,
  BillingCycle,
  CheckoutResult,
} from '@/lib/payments';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function createSubscriptionCheckout(
  planTier: 'pro' | 'studio' | 'business',
  billingCycle: BillingCycle = 'monthly',
  returnPath: string = '/dashboard/settings/billing'
): Promise<CheckoutResult> {
  const clerkUser = await currentUser();
  const userId = await getAuthenticatedUserId();

  if (!clerkUser || !userId) {
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
    userId,
    userEmail,
    userName,
    planTier,
    billingCycle,
    successUrl,
    cancelUrl,
  });
}

export async function getBillingPortalUrl(returnPath: string = '/dashboard/settings/billing'): Promise<string | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const providerName = user.paymentProvider || undefined;
  const customerId = user.customerId || user.stripeCustomerId || user.flutterwaveCustomerId || undefined;
  const subscriptionId = user.subscriptionId || user.flutterwaveTransactionRef || undefined;

  const provider = getPaymentProvider(providerName);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnUrl = `${baseUrl}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;

  return await provider.getPortalUrl({
    customerId,
    subscriptionId,
    userId,
    returnUrl,
  });
}

export async function cancelUserSubscription(reason?: string): Promise<{ success: boolean; message?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('User not found');

  const subscriptionId = user.subscriptionId || user.flutterwaveTransactionRef || undefined;
  const providerName = user.paymentProvider || undefined;

  if (!subscriptionId) {
    throw new Error('No active subscription found');
  }

  const provider = getPaymentProvider(providerName);

  if (provider.cancelSubscription) {
    await provider.cancelSubscription({
      subscriptionId,
      userId,
      reason,
    });
  }

  // Update subscription status in Neon
  await db
    .update(users)
    .set({ subscriptionStatus: 'canceled' })
    .where(eq(users.id, userId));

  return { success: true, message: 'Subscription canceled successfully' };
}
