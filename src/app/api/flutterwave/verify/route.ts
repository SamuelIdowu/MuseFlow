import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/flutterwave';
import { FEATURES } from '@/lib/featureFlags';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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
            const { email } = customer;

            await db
                .update(users)
                .set({
                    flutterwaveCustomerId: String(customer.id),
                    flutterwaveTransactionRef: tx_ref,
                    flutterwavePlanId: plan,
                    subscriptionStatus: 'active',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subscriptionPlan: plan === 'PLN_xxxx' ? 'business' : 'pro',
                    planTier: plan === 'PLN_xxxx' ? 'business' : 'pro',
                })
                .where(eq(users.email, email));

            return NextResponse.json({ message: 'Subscription verified and activated', data: response.data });
        } else {
            return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
        }
    } catch (error) {
        console.error('Verify Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
