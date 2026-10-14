import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cancelSubscription } from '@/lib/flutterwave';
import { FEATURES } from '@/lib/featureFlags';
import { ensureDbUser } from '@/db/queries/users';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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
        const user = await currentUser();

        if (!clerkUserId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUserId, email);

        if (!userId) {
            return NextResponse.json({ error: 'User not synchronized' }, { status: 401 });
        }

        const { subscription_id } = await req.json();

        if (!subscription_id) {
            return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
        }

        // Verify user exists in database
        const userProfile = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userProfile) {
            return NextResponse.json({ error: 'User record not found' }, { status: 404 });
        }

        // Call Flutterwave to cancel
        const response = await cancelSubscription(subscription_id);

        if (response.status === 'success') {
            await db
                .update(users)
                .set({
                    subscriptionStatus: 'cancelled',
                })
                .where(eq(users.id, userId));

            return NextResponse.json({ message: 'Subscription cancelled' });
        }

        return NextResponse.json({ error: 'Cancellation failed' }, { status: 400 });

    } catch (error) {
        console.error('Manage Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
