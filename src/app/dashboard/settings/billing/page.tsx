
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { getUserSubscription } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { SubscriptionManageButton } from './SubscriptionManageButton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { ensureSupabaseUser } from '@/lib/supabaseServerClient';
import { FEATURES } from '@/lib/featureFlags';

export default async function BillingPage() {
    let supabaseUserId: string;
    try {
        supabaseUserId = await getAuthenticatedSupabaseUserId();
    } catch (error) {
        console.error('Billing page auth error:', error);
        redirect('/sign-in');
    }


    const subscription = await getUserSubscription(supabaseUserId);

    const isPro = subscription?.status === 'active' && subscription.price_id === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO;
    // Simplified plan check. In reality, compare price IDs or fetch product details.

    const planName = subscription
        ? (subscription.price_id === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_BUSINESS ? 'Business' : 'Pro')
        : 'Free';

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
                    Manage your subscription and billing information.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plan</CardTitle>
                    <CardDescription>
                        You are currently on the <strong>{planName}</strong> plan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        {subscription?.status === 'active' ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                        ) : subscription?.status === 'trialing' ? (
                            <Badge variant="secondary">Trial</Badge>
                        ) : subscription ? (
                            <Badge variant="destructive">{subscription.status}</Badge>
                        ) : (
                            <Badge variant="outline">Free</Badge>
                        )}
                    </div>

                    {subscription && (
                        <div className="text-sm text-muted-foreground">
                            {subscription.cancel_at_period_end ? (
                                <div className="flex items-center text-amber-600">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Your subscription will end on {new Date(subscription.current_period_end!).toLocaleDateString()}.
                                </div>
                            ) : (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Your subscription renews on {new Date(subscription.current_period_end!).toLocaleDateString()}.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {subscription ? (
                        <SubscriptionManageButton subscriptionId={subscription.id} userId={supabaseUserId} />
                    ) : (
                        <Button asChild>
                            <a href="/pricing">Upgrade to Pro</a>
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Usage Stats could go here */}
        </div>
    );
}
