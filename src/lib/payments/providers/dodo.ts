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

export class DodoPaymentsProvider implements PaymentProvider {
  readonly name = 'dodo';
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    this.webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET || '';
    this.baseUrl =
      process.env.DODO_PAYMENTS_ENVIRONMENT === 'test'
        ? 'https://test.dodopayments.com'
        : 'https://live.dodopayments.com';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const productId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.dodo?.yearly
        : planConfig?.productIds?.dodo?.monthly;

    if (!productId) {
      throw new Error(`Missing Dodo product ID for plan ${params.planTier} (${params.billingCycle})`);
    }

    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        payment_link: true,
        return_url: params.successUrl,
        customer: {
          email: params.userEmail,
          name: params.userName,
        },
        metadata: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          planTier: params.planTier,
          billingCycle: params.billingCycle,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.payment_link) {
      throw new Error(data.message || 'Failed to create Dodo Payments checkout');
    }

    return {
      checkoutUrl: data.payment_link,
      sessionId: data.subscription_id || data.payment_id,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    if (!this.apiKey || !params.customerId) return null;

    try {
      const response = await fetch(`${this.baseUrl}/customers/${params.customerId}/portal`, {
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
      return data.portal_url || null;
    } catch {
      return null;
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.apiKey) throw new Error('DODO_PAYMENTS_API_KEY is not configured');

    const response = await fetch(`${this.baseUrl}/subscriptions/${params.subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled',
      }),
    });

    return response.ok;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const payload = JSON.parse(rawBody);
    const eventTypeRaw = payload.type || payload.event_type;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (eventTypeRaw === 'subscription.active' || eventTypeRaw === 'subscription.created') {
      eventType = 'subscription.created';
      status = 'active';
    } else if (eventTypeRaw === 'subscription.renewed' || eventTypeRaw === 'subscription.updated') {
      eventType = 'subscription.updated';
      status = 'active';
    } else if (eventTypeRaw === 'subscription.cancelled' || eventTypeRaw === 'subscription.canceled') {
      eventType = 'subscription.canceled';
      status = 'canceled';
    } else if (eventTypeRaw === 'payment.succeeded') {
      eventType = 'payment.succeeded';
      status = 'active';
    } else if (eventTypeRaw === 'payment.failed') {
      eventType = 'payment.failed';
      status = 'past_due';
    }

    const metadata = data.metadata || {};
    const planTier: PlanTier = (metadata.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = data.next_billing_date
      ? new Date(data.next_billing_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'dodo',
      eventId: payload.id || `dodo_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId,
      userEmail: data.customer?.email || metadata.userEmail,
      customerId: data.customer_id || data.customer?.customer_id,
      subscriptionId: data.subscription_id || data.id,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
