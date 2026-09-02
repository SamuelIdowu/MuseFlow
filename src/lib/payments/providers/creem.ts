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

export class CreemPaymentsProvider implements PaymentProvider {
  readonly name = 'creem';
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.webhookSecret = process.env.CREEM_WEBHOOK_SECRET || '';
    this.baseUrl = 'https://api.creem.io/v1';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const productId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.creem?.yearly
        : planConfig?.productIds?.creem?.monthly;

    if (!productId) {
      throw new Error(`Missing Creem product ID for plan ${params.planTier} (${params.billingCycle})`);
    }

    const response = await fetch(`${this.baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        customer_email: params.userEmail,
        customer_name: params.userName,
        success_url: params.successUrl,
        metadata: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          planTier: params.planTier,
          billingCycle: params.billingCycle,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.checkout_url) {
      throw new Error(data.message || 'Failed to create Creem checkout');
    }

    return {
      checkoutUrl: data.checkout_url,
      sessionId: data.id,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    if (!this.apiKey || !params.customerId) return null;

    try {
      const response = await fetch(`${this.baseUrl}/customers/${params.customerId}/portal`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
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
    if (!this.apiKey) throw new Error('CREEM_API_KEY is not configured');

    const response = await fetch(`${this.baseUrl}/subscriptions/${params.subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const payload = JSON.parse(rawBody);
    const eventTypeRaw = payload.event || payload.type;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (eventTypeRaw === 'subscription.created' || eventTypeRaw === 'subscription.activated') {
      eventType = 'subscription.created';
      status = 'active';
    } else if (eventTypeRaw === 'subscription.canceled' || eventTypeRaw === 'subscription.expired') {
      eventType = 'subscription.canceled';
      status = 'canceled';
    } else if (eventTypeRaw === 'checkout.completed' || eventTypeRaw === 'payment.succeeded') {
      eventType = 'payment.succeeded';
      status = 'active';
    }

    const metadata = data.metadata || {};
    const planTier: PlanTier = (metadata.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = data.current_period_end
      ? new Date(data.current_period_end)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'creem',
      eventId: payload.id || `creem_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId,
      userEmail: data.customer_email || metadata.userEmail,
      customerId: data.customer_id,
      subscriptionId: data.subscription_id || data.id,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
