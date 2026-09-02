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

export class FlutterwavePaymentProvider implements PaymentProvider {
  readonly name = 'flutterwave';
  private secretKey: string;
  private secretHash: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.secretHash = process.env.FLUTTERWAVE_SECRET_HASH || '';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.secretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const planId =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.flutterwave?.yearly
        : planConfig?.productIds?.flutterwave?.monthly;

    const amount =
      params.billingCycle === 'yearly'
        ? planConfig?.priceYearly || 0
        : planConfig?.priceMonthly || 0;

    const txRef = `flw_${params.userId}_${Date.now()}`;

    const body: Record<string, any> = {
      tx_ref: txRef,
      amount,
      currency: 'USD',
      redirect_url: params.successUrl,
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: params.userEmail,
        name: params.userName || '',
      },
      meta: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        planTier: params.planTier,
        billingCycle: params.billingCycle,
      },
      customizations: {
        title: `MuseFlow - ${planConfig.name}`,
        description: planConfig.description,
      },
    };

    if (planId) {
      body.payment_plan = planId;
    }

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'success' || !data.data?.link) {
      throw new Error(data.message || 'Failed to initialize Flutterwave payment');
    }

    return {
      checkoutUrl: data.data.link,
      sessionId: txRef,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    return null;
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');

    const response = await fetch(`https://api.flutterwave.com/v3/subscriptions/${params.subscriptionId}/cancel`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    const data = await response.json();
    return data.status === 'success';
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    const signature =
      headers instanceof Headers
        ? headers.get('verif-hash')
        : (headers['verif-hash'] as string);

    if (this.secretHash && signature && signature !== this.secretHash) {
      throw new Error('Invalid Flutterwave webhook secret hash');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    if (event === 'charge.completed' || payload.status === 'successful') {
      eventType = 'payment.succeeded';
      status = 'active';
    } else if (event === 'subscription.cancelled') {
      eventType = 'subscription.canceled';
      status = 'canceled';
    }

    const metadata = data.meta || payload.meta || {};
    const planTier: PlanTier = (metadata.planTier || 'pro') as PlanTier;
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'flutterwave',
      eventId: payload.id?.toString() || data.id?.toString() || data.tx_ref || `flw_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId,
      userEmail: data.customer?.email || metadata.userEmail,
      customerId: data.customer?.id?.toString(),
      subscriptionId: data.plan?.toString() || data.subscription_id || data.tx_ref,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
