import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FEATURES } from '@/lib/featureFlags';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

        if (!secretHash) {
            console.error('[FLUTTERWAVE_SECURITY] FLUTTERWAVE_SECRET_HASH is not configured in environment');
            return NextResponse.json({ error: 'Webhook verification unavailable' }, { status: 503 });
        }

        const isSignatureValid =
            typeof signature === 'string' &&
            signature.length === secretHash.length &&
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(secretHash));

        if (!isSignatureValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // FEATURE FLAG: When payments are disabled, acknowledge verified webhook without processing
        if (!FEATURES.PAYMENTS_ENABLED) {
            return NextResponse.json({ 
                status: 'success',
                message: 'Payments disabled - webhook acknowledged but not processed'
            });
        }

        const payload = await req.json();
        const { event, data } = payload;

        if (event === 'charge.completed' && data.status === 'successful') {
            // Handle successful charge (renewal or first time)
            const email = data.customer.email;
            // Logic to extend subscription expiry
            await supabaseAdmin
                .from('users')
                .update({
                    subscription_status: 'active',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Logic should ideally be more robust based on plan interval
                })
                .eq('email', email);
        } else if (event === 'subscription.cancelled') {
            const email = data.customer.email;
            await supabaseAdmin
                .from('users')
                .update({ subscription_status: 'cancelled' })
                .eq('email', email);
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
