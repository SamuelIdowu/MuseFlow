import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cancelSubscription } from '@/lib/flutterwave';
import { FEATURES } from '@/lib/featureFlags';
import { createSupabaseServiceClient, getSupabaseUserId } from '@/lib/supabaseServerClient';

export async function POST(req: Request) {
    // FEATURE FLAG: When payments are disabled, return success without processing
    if (!FEATURES.PAYMENTS_ENABLED) {
        return NextResponse.json({ 
            message: 'Payments are currently disabled. No subscription to cancel.',
            disabled: true 
        }, { status: 200 });
    }

    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUserId = await getSupabaseUserId(clerkUserId);
        if (!supabaseUserId) {
            return NextResponse.json({ error: 'User not synchronized' }, { status: 401 });
        }

        const { subscription_id } = await req.json();

        if (!subscription_id) {
            return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
        }

        const supabase = createSupabaseServiceClient();

        // Verify the user owns this subscription
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('id, flutterwave_customer_id')
            .eq('id', supabaseUserId)
            .single();

        if (profileError || !userProfile) {
            return NextResponse.json({ error: 'User record not found' }, { status: 404 });
        }

        // Call Flutterwave to cancel
        const response = await cancelSubscription(subscription_id);

        if (response.status === 'success') {
            // Update DB for authenticated user only
            const { error } = await supabase
                .from('users')
                .update({
                    subscription_status: 'cancelled',
                })
                .eq('id', supabaseUserId);

            if (error) throw error;

            return NextResponse.json({ message: 'Subscription cancelled' });
        }

        return NextResponse.json({ error: 'Cancellation failed' }, { status: 400 });

    } catch (error) {
        console.error('Manage Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
