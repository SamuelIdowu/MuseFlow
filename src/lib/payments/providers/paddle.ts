import crypto from 'crypto';
import {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  PortalParams,
  CancelSubscriptionParams,
  NormalizedWebhookEvent,
  WebhookEventType,
  PlanTier,
  SubscriptionStatus,
} from '../types';
import { PLANS } from '../config';

export class PaddlePaymentsProvider implements PaymentProvider {
  readonly name = 'paddle';
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY || '';
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || '';
    this.baseUrl =
      process.env.PADDLE_ENVIRONMENT === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey) {
      throw new Error('PADDLE_API_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const priceId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.paddle?.yearly
        : planConfig?.productIds?.paddle?.monthly;

    if (!priceId) {
      throw new Error(`Missing Paddle price ID for plan ${params.planTier} (${params.billingCycle})`);
    }

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          planTier: params.planTier,
          billingCycle: params.billingCycle,
        },
        customer: {
          email: params.userEmail,
          name: params.userName,
        },
        checkout: {
          success_url: params.successUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.data) {
      throw new Error(data.error?.message || 'Failed to create Paddle transaction');
    }

    const checkoutUrl = data.data.checkout?.url || `${params.successUrl}?paddle_txn=${data.data.id}`;
    return {
      checkoutUrl,
      sessionId: data.data.id,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    if (!this.apiKey || !params.customerId) return null;

    try {
      const response = await fetch(`${this.baseUrl}/customers/${params.customerId}/portal-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: params.returnUrl,
        }),
      });

      const data = await response.json();
      return data.data?.urls?.general?.overview || null;
    } catch (err) {
      console.error('[Paddle getPortalUrl Error]', err);
      return null;
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.apiKey) throw new Error('PADDLE_API_KEY is not configured');

    const response = await fetch(`${this.baseUrl}/subscriptions/${params.subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        effective_from: 'next_billing_period',
      }),
    });

    return response.ok;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const signatureHeader =
      headers instanceof Headers
        ? headers.get('paddle-signature')
        : (headers['paddle-signature'] as string);

    if (this.webhookSecret && signatureHeader) {
      // paddle-signature format: ts=12345;h1=hash
      const parts = signatureHeader.split(';').reduce((acc: Record<string, string>, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const ts = parts['ts'];
      const h1 = parts['h1'];

      if (ts && h1) {
        const signedPayload = `${ts}:${rawBody}`;
        const computedHash = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(signedPayload)
          .digest('hex');

        if (computedHash !== h1) {
          throw new Error('Invalid Paddle webhook signature');
        }
      }
    }

    const payload = JSON.parse(rawBody);
    const eventTypeRaw = payload.event_type;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (eventTypeRaw.startsWith('subscription.')) {
      if (eventTypeRaw === 'subscription.created') eventType = 'subscription.created';
      else if (eventTypeRaw === 'subscription.canceled') {
        eventType = 'subscription.canceled';
        status = 'canceled';
      } else {
        eventType = 'subscription.updated';
        status = (data.status as SubscriptionStatus) || 'active';
      }
    } else if (eventTypeRaw === 'transaction.completed' || eventTypeRaw === 'transaction.paid') {
      eventType = 'payment.succeeded';
      status = 'active';
    } else if (eventTypeRaw === 'transaction.past_due' || eventTypeRaw === 'transaction.payment_failed') {
      eventType = 'payment.failed';
      status = 'past_due';
    }

    const customData = data.custom_data || {};
    const planTier: PlanTier = (customData.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'paddle',
      eventId: payload.event_id || `paddle_${Date.now()}`,
      eventType,
      workspaceId: customData.workspaceId,
      userId: customData.userId,
      userEmail: data.customer?.email || customData.userEmail,
      customerId: data.customer_id,
      subscriptionId: data.id,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
