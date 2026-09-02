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

export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const priceId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.stripe?.yearly
        : planConfig?.productIds?.stripe?.monthly;

    if (!priceId) {
      throw new Error(`Missing Stripe price ID for plan ${params.planTier} (${params.billingCycle})`);
    }

    const formData = new URLSearchParams();
    formData.append('mode', 'subscription');
    formData.append('line_items[0][price]', priceId);
    formData.append('line_items[0][quantity]', '1');
    formData.append('success_url', params.successUrl);
    if (params.cancelUrl) {
      formData.append('cancel_url', params.cancelUrl);
    }
    formData.append('customer_email', params.userEmail);
    formData.append('metadata[userId]', params.userId);
    if (params.workspaceId) formData.append('metadata[workspaceId]', params.workspaceId);
    formData.append('metadata[planTier]', params.planTier);
    formData.append('metadata[billingCycle]', params.billingCycle);
    formData.append('subscription_data[metadata][userId]', params.userId);
    if (params.workspaceId) formData.append('subscription_data[metadata][workspaceId]', params.workspaceId);
    formData.append('subscription_data[metadata][planTier]', params.planTier);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    if (!response.ok || !data.url) {
      throw new Error(data.error?.message || 'Failed to create Stripe checkout session');
    }

    return {
      checkoutUrl: data.url,
      sessionId: data.id,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    if (!this.secretKey || !params.customerId) return null;

    try {
      const formData = new URLSearchParams();
      formData.append('customer', params.customerId);
      formData.append('return_url', params.returnUrl);

      const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');

    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${params.subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    return response.ok;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const signature =
      headers instanceof Headers
        ? headers.get('stripe-signature')
        : (headers['stripe-signature'] as string);

    if (this.webhookSecret && signature) {
      const signatureParts = signature.split(',').reduce((acc: Record<string, string>, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const timestamp = signatureParts['t'];
      const expectedSig = signatureParts['v1'];

      if (timestamp && expectedSig) {
        const signedPayload = `${timestamp}.${rawBody}`;
        const computedSig = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(signedPayload)
          .digest('hex');

        if (computedSig !== expectedSig) {
          throw new Error('Invalid Stripe webhook signature');
        }
      }
    }

    const payload = JSON.parse(rawBody);
    const eventTypeRaw = payload.type;
    const dataObj = payload.data?.object || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (eventTypeRaw === 'customer.subscription.created' || eventTypeRaw === 'checkout.session.completed') {
      eventType = 'subscription.created';
      status = 'active';
    } else if (eventTypeRaw === 'customer.subscription.updated') {
      eventType = 'subscription.updated';
      status = (dataObj.status as SubscriptionStatus) || 'active';
    } else if (eventTypeRaw === 'customer.subscription.deleted') {
      eventType = 'subscription.canceled';
      status = 'canceled';
    } else if (eventTypeRaw === 'invoice.paid' || eventTypeRaw === 'invoice.payment_succeeded') {
      eventType = 'payment.succeeded';
      status = 'active';
    } else if (eventTypeRaw === 'invoice.payment_failed') {
      eventType = 'payment.failed';
      status = 'past_due';
    }

    const metadata = dataObj.metadata || {};
    const planTier: PlanTier = (metadata.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = dataObj.current_period_end
      ? new Date(dataObj.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'stripe',
      eventId: payload.id || `stripe_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId,
      userEmail: dataObj.customer_email || dataObj.customer_details?.email || metadata.userEmail,
      customerId: typeof dataObj.customer === 'string' ? dataObj.customer : dataObj.customer?.id,
      subscriptionId: dataObj.subscription || (eventTypeRaw.startsWith('customer.subscription') ? dataObj.id : undefined),
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
