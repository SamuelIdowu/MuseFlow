import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function POST(req: NextRequest) {
  try {
    // 1. Critical: Read RAW body as string for HMAC signature verification
    const rawBody = await req.text();
    const provider = getPaymentProvider();

    // 2. Delegate signature verification & normalization to the adapter
    const event = await provider.parseWebhook(rawBody, req.headers);

    const supabase = createSupabaseServiceClient();

    // 3. Webhook Idempotency Check (prevent duplicate executions on retries)
    const { data: existing } = await supabase
      .from('billing_webhook_events')
      .select('id')
      .eq('event_id', event.eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { received: true, note: 'Already processed' },
        { status: 200 }
      );
    }

    // 4. Update User Subscription State
    const updateData: Record<string, any> = {
      plan_tier: event.planTier || 'free',
      subscription_status: event.status || 'active',
      payment_provider: event.provider,
    };

    if (event.subscriptionId) updateData.subscription_id = event.subscriptionId;
    if (event.customerId) updateData.customer_id = event.customerId;
    if (event.currentPeriodEnd) {
      updateData.current_period_end = event.currentPeriodEnd.toISOString();
    }

    // Map backwards-compatible legacy fields if applicable
    updateData.subscription_plan = event.planTier || 'free';

    // Locate target user
    if (event.userId) {
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', event.userId);
    } else if (event.userEmail) {
      await supabase
        .from('users')
        .update(updateData)
        .eq('email', event.userEmail);
    } else if (event.customerId) {
      await supabase
        .from('users')
        .update(updateData)
        .or(`customer_id.eq.${event.customerId},stripe_customer_id.eq.${event.customerId},flutterwave_customer_id.eq.${event.customerId}`);
    } else if (event.subscriptionId) {
      await supabase
        .from('users')
        .update(updateData)
        .or(`subscription_id.eq.${event.subscriptionId},flutterwave_transaction_ref.eq.${event.subscriptionId}`);
    }

    // 5. Record Event for Idempotency
    await supabase.from('billing_webhook_events').insert({
      event_id: event.eventId,
      provider: event.provider,
      event_type: event.eventType,
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
