import { NextResponse } from 'next/server';
import { cancelSubscription } from '@/lib/flutterwave';
import { FEATURES } from '@/lib/featureFlags';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    // FEATURE FLAG: When payments are disabled, return success without processing
    if (!FEATURES.PAYMENTS_ENABLED) {
        return NextResponse.json({ 
            message: 'Payments are currently disabled. No subscription to cancel.',
            disabled: true 
        }, { status: 200 });
    }

    try {
        const { subscription_id, user_id } = await req.json();

        if (!subscription_id) {
            return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
        }

        // Call Flutterwave to cancel
        const response = await cancelSubscription(subscription_id);

        if (response.status === 'success') {
            // Update DB
            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    subscription_status: 'cancelled',
                })
                .eq('id', user_id); // Ensure we have user_id or lookup by subscription_id if unique

            if (error) throw error;

            return NextResponse.json({ message: 'Subscription cancelled' });
        }

        return NextResponse.json({ error: 'Cancellation failed' }, { status: 400 });

    } catch (error) {
        console.error('Manage Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
