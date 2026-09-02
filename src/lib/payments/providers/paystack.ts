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

export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = 'paystack';
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const planConfig = PLANS[params.planTier];
    const planCode =
      params.billingCycle === 'yearly'
        ? planConfig?.productIds?.paystack?.yearly
        : planConfig?.productIds?.paystack?.monthly;

    const amountInKoboOrCents =
      params.billingCycle === 'yearly'
        ? (planConfig?.priceYearly || 0) * 100
        : (planConfig?.priceMonthly || 0) * 100;

    const body: Record<string, any> = {
      email: params.userEmail,
      amount: amountInKoboOrCents,
      callback_url: params.successUrl,
      metadata: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        planTier: params.planTier,
        billingCycle: params.billingCycle,
        userName: params.userName,
      },
    };

    if (planCode) {
      body.plan = planCode;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack checkout');
    }

    return {
      checkoutUrl: data.data.authorization_url,
      sessionId: data.data.reference,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    // Paystack manages subscriptions via their email management links or API
    return null;
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const response = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: params.subscriptionId,
        token: params.subscriptionId,
      }),
    });

    const data = await response.json();
    return Boolean(data.status);
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const signature =
      headers instanceof Headers
        ? headers.get('x-paystack-signature')
        : (headers['x-paystack-signature'] as string);

    if (!signature) {
      throw new Error('Missing x-paystack-signature header');
    }

    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid Paystack webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data || {};

    let eventType: WebhookEventType = 'unknown';
    let status: SubscriptionStatus = 'active';

    switch (event) {
      case 'subscription.create':
        eventType = 'subscription.created';
        status = 'active';
        break;
      case 'subscription.disable':
      case 'subscription.not_renew':
        eventType = 'subscription.canceled';
        status = 'canceled';
        break;
      case 'charge.success':
        eventType = 'payment.succeeded';
        status = 'active';
        break;
      case 'invoice.payment_failed':
        eventType = 'payment.failed';
        status = 'past_due';
        break;
      default:
        eventType = 'unknown';
    }

    const metadata = data.metadata || {};
    const planTier: PlanTier =
      (metadata.planTier ||
        (data.plan?.name?.toLowerCase().includes('studio') || data.plan?.name?.toLowerCase().includes('business')
          ? 'business'
          : 'pro')) as PlanTier;

    const currentPeriodEnd = data.next_payment_date
      ? new Date(data.next_payment_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      provider: 'paystack',
      eventId: payload.id?.toString() || data.reference || `paystack_${Date.now()}`,
      eventType,
      workspaceId: metadata.workspaceId,
      userId: metadata.userId,
      userEmail: data.customer?.email || metadata.userEmail,
      customerId: data.customer?.customer_code || data.customer?.id?.toString(),
      subscriptionId: data.subscription_code || data.plan?.plan_code || data.reference,
      planTier,
      status,
      currentPeriodEnd,
      rawPayload: payload,
    };
  }
}
