
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserSubscription } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { SubscriptionManageButton } from './SubscriptionManageButton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { ensureSupabaseUser } from '@/lib/supabaseServerClient';

export default async function BillingPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect('/sign-in');
    }

    // Ensure user exists in Supabase to avoid errors
    const email = user.emailAddresses[0].emailAddress;
    await ensureSupabaseUser(userId, email);

    // Get Supabase user ID (we know ensureSupabaseUser handles it, but we need the ID)
    // Actually getUserSubscription takes generic user ID (which matches auth.uid() in Supabase)
    // If we are using Clerk, we need to make sure getUserSubscription uses the correct ID.
    // getUserSubscription uses `createSupabaseServiceClient` which is admin.
    // But wait, `subscriptions` table `user_id` is uuid. Clerk ID is string.
    // `getSupabaseUserId` converts Clerk ID to Supabase UUID.
    // I must check `getUserSubscription` implementation.
    // It receives `userId`. 
    // In `subscription.ts`: `eq('user_id', userId)`.
    // So I must pass the Supabase UUID, NOT the Clerk ID.

    const { ensureSupabaseUser: ensureUser } = await import('@/lib/supabaseServerClient');
    const supabaseUserId = await ensureUser(userId, email);

    if (!supabaseUserId) {
        return <div>Error loading user data.</div>;
    }

    const subscription = await getUserSubscription(supabaseUserId);

    const isPro = subscription?.status === 'active' && subscription.price_id === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_PRO;
    // Simplified plan check. In reality, compare price IDs or fetch product details.

    const planName = subscription
        ? (subscription.price_id === process.env.NEXT_PUBLIC_FLUTTERWAVE_PLAN_ID_BUSINESS ? 'Business' : 'Pro')
        : 'Free';

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
