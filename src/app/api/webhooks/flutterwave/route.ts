import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || 'default-secret-hash'; // IMPORTANT: Set this in env

        if (!signature || signature !== secretHash) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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
