import { NextResponse } from 'next/server';
import { FEATURES } from '@/lib/featureFlags';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
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
            await db
                .update(users)
                .set({
                    subscriptionStatus: 'active',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                })
                .where(eq(users.email, email));
        } else if (event === 'subscription.cancelled') {
            const email = data.customer.email;
            await db
                .update(users)
                .set({ subscriptionStatus: 'cancelled' })
                .where(eq(users.email, email));
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
