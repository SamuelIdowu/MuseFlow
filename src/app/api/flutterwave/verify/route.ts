import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/flutterwave';
import { createClient } from '@supabase/supabase-js';
import { FEATURES } from '@/lib/featureFlags';

// Initialize Supabase Admin client for DB updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    // FEATURE FLAG: When payments are disabled, return success without processing
    if (!FEATURES.PAYMENTS_ENABLED) {
        return NextResponse.json({ 
            message: 'Payments are currently disabled. All features are available.',
            disabled: true 
        }, { status: 200 });
    }

    try {
        const { transaction_id } = await req.json();

        if (!transaction_id) {
            return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
        }

        const response = await verifyTransaction(transaction_id);

        if (response.status === 'success') {
            const { customer, plan, tx_ref } = response.data;

            // Update User subscription in DB
            // Assuming customer.email matches user email, or we passed userId in meta
            const { email } = customer;

            // Update user subscription
            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    flutterwave_customer_id: customer.id, // Store their FW customer ID
                    flutterwave_transaction_ref: tx_ref,
                    flutterwave_plan_id: plan, // The plan ID
                    subscription_status: 'active',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Approx 30 days, ideally get from webhook/plan details
                    subscription_plan: plan === 'PLN_xxxx' ? 'business' : 'pro' // Map ID to name if needed
                })
                .eq('email', email);

            if (error) {
                console.error('DB Update Error:', error);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }

            return NextResponse.json({ message: 'Subscription verified and activated', data: response.data });
        } else {
            return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
        }
    } catch (error) {
        console.error('Verify Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
