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

export class PolarPaymentsProvider implements PaymentProvider {
  readonly name = 'polar';
  private accessToken: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.POLAR_ACCESS_TOKEN || '';
    this.webhookSecret = process.env.POLAR_WEBHOOK_SECRET || '';
    this.baseUrl =
      process.env.POLAR_ENVIRONMENT === 'sandbox'
        ? 'https://sandbox-api.polar.sh/v1'
        : 'https://api.polar.sh/v1';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.accessToken) {
      throw new Error('POLAR_ACCESS_TOKEN is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const productId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.polar?.yearly
        : planConfig?.productIds?.polar?.monthly;

    if (!productId) {
      throw new Error(`Missing Polar product ID for plan ${params.planTier} (${params.billingCycle})`);
    }

    const response = await fetch(`${this.baseUrl}/checkouts/custom/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
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
    if (!response.ok || !data.url) {
      throw new Error(data.detail || data.message || 'Failed to create Polar checkout session');
    }

    return {
      checkoutUrl: data.url,
      sessionId: data.id,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    if (!this.accessToken || !params.customerId) return null;

    try {
      const response = await fetch(`${this.baseUrl}/customer-sessions/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: params.customerId,
        }),
      });

      const data = await response.json();
      return data.customer_portal_url || null;
    } catch {
      return null;
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.accessToken) throw new Error('POLAR_ACCESS_TOKEN is not configured');

    const response = await fetch(`${this.baseUrl}/subscriptions/${params.subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return response.ok;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const payload = JSON.parse(rawBody);
    const eventTypeRaw = payload.type;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (eventTypeRaw === 'subscription.created') {
      eventType = 'subscription.created';
      status = 'active';
    } else if (eventTypeRaw === 'subscription.updated') {
      eventType = 'subscription.updated';
      status = (data.status as SubscriptionStatus) || 'active';
    } else if (eventTypeRaw === 'subscription.canceled' || eventTypeRaw === 'subscription.revoked') {
      eventType = 'subscription.canceled';
      status = 'canceled';
    } else if (eventTypeRaw === 'order.created') {
      eventType = 'payment.succeeded';
      status = 'active';
    }

    const metadata = data.metadata || (data.custom_field_data as Record<string, any>) || {};
    const planTier: PlanTier = (metadata.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = data.current_period_end
      ? new Date(data.current_period_end)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'polar',
      eventId: payload.id || `polar_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId || data.user_id,
      userEmail: data.user?.email || data.customer?.email || metadata.userEmail,
      customerId: data.customer_id || data.user_id,
      subscriptionId: data.id,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
