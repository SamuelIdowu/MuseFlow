/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { db } from '@/db';
import { billingWebhookEvents } from '@/db/schema/billing';
import { users } from '@/db/schema/users';
import { eq, or } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // 1. Critical: Read RAW body as string for HMAC signature verification
    const rawBody = await req.text();
    const provider = getPaymentProvider();

    // 2. Delegate signature verification & normalization to the adapter
    const event = await provider.parseWebhook(rawBody, req.headers);

    // 3. Webhook Idempotency Check (prevent duplicate executions on retries)
    const existing = await db.query.billingWebhookEvents.findFirst({
      where: eq(billingWebhookEvents.eventId, event.eventId),
    });

    if (existing) {
      return NextResponse.json(
        { received: true, note: 'Already processed' },
        { status: 200 }
      );
    }

    // 4. Update User Subscription State
    const updateData: Record<string, any> = {
      planTier: event.planTier || 'free',
      subscriptionStatus: event.status || 'active',
      paymentProvider: event.provider,
      subscriptionPlan: event.planTier || 'free',
    };

    if (event.subscriptionId) updateData.subscriptionId = event.subscriptionId;
    if (event.customerId) updateData.customerId = event.customerId;
    if (event.currentPeriodEnd) {
      updateData.currentPeriodEnd = event.currentPeriodEnd;
    }

    // Locate target user
    if (event.userId) {
      await db.update(users).set(updateData).where(eq(users.id, event.userId));
    } else if (event.userEmail) {
      await db.update(users).set(updateData).where(eq(users.email, event.userEmail));
    } else if (event.customerId) {
      await db.update(users).set(updateData).where(
        or(
          eq(users.customerId, event.customerId),
          eq(users.stripeCustomerId, event.customerId),
          eq(users.flutterwaveCustomerId, event.customerId)
        )
      );
    } else if (event.subscriptionId) {
      await db.update(users).set(updateData).where(
        or(
          eq(users.subscriptionId, event.subscriptionId),
          eq(users.flutterwaveTransactionRef, event.subscriptionId)
        )
      );
    }

    // 5. Record Event for Idempotency
    await db.insert(billingWebhookEvents).values({
      eventId: event.eventId,
      provider: event.provider,
      eventType: event.eventType,
      payload: event.rawPayload as any,
    });

    return NextResponse.json({ received: true, status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('[Billing Webhook Error]', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
