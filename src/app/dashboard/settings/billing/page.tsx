import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { getUserSubscriptionDetails } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { SubscriptionManageButton } from './SubscriptionManageButton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { FEATURES } from '@/lib/featureFlags';
import { PLANS } from '@/lib/payments/config';
import Link from 'next/link';

export default async function BillingPage() {
  let supabaseUserId: string;
  try {
    supabaseUserId = await getAuthenticatedSupabaseUserId();
  } catch (error) {
    console.error('Billing page auth error:', error);
    redirect('/sign-in');
  }

  const subscription = await getUserSubscriptionDetails(supabaseUserId);

  const planTier = subscription?.planTier || 'free';
  const planConfig = PLANS[planTier] || PLANS.free;
  const isPaid = planTier !== 'free' && subscription?.status === 'active';

  // FEATURE FLAG: When payments are disabled, show simplified view
  if (!FEATURES.PAYMENTS_ENABLED) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground">
            Billing is currently disabled. All features are available to you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Features Unlocked</CardTitle>
            <CardDescription>
              You have access to all features without any restrictions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">All Access</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Unlimited AI Generations, Profiles, Canvas Sessions, and Campaigns
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Subscription</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan, billing details, and active payment provider.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                You are currently on the <strong>{planConfig.name}</strong> ({planTier.toUpperCase()}) plan.
              </CardDescription>
            </div>
            {subscription?.provider && (
              <Badge variant="outline" className="capitalize text-xs">
                Gateway: {subscription.provider}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            {subscription?.status === 'active' ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
            ) : subscription?.status === 'trialing' ? (
              <Badge variant="secondary">Trial</Badge>
            ) : subscription?.status === 'canceled' ? (
              <Badge variant="destructive">Canceled</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </div>

          {subscription?.currentPeriodEnd && (
            <div className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? (
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-2">Plan Features Included:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {planConfig.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t pt-4">
          {isPaid ? (
            <SubscriptionManageButton
              subscriptionId={subscription?.subscriptionId}
              userId={supabaseUserId}
            />
          ) : (
            <Button asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
