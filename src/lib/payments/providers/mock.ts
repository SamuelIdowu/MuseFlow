import {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  PortalParams,
  CancelSubscriptionParams,
  NormalizedWebhookEvent,
} from '../types';

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const returnUrl = new URL(params.successUrl);
    returnUrl.searchParams.set('session_id', `mock_session_${Date.now()}`);
    returnUrl.searchParams.set('plan', params.planTier);
    returnUrl.searchParams.set('provider', 'mock');
    returnUrl.searchParams.set('status', 'success');

    return {
      checkoutUrl: returnUrl.toString(),
      sessionId: `mock_session_${Date.now()}`,
    };
  }

  async getPortalUrl(params: PortalParams): Promise<string | null> {
    const returnUrl = new URL(params.returnUrl);
    returnUrl.searchParams.set('portal', 'mock');
    return returnUrl.toString();
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<boolean> {
    return true;
  }

  async parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    let payload: any = {};
    try {
      payload = typeof rawBody === 'string' && rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = {};
    }

    return {
      provider: 'mock',
      eventId: payload.id || `mock_event_${Date.now()}`,
      eventType: payload.type || 'subscription.created',
      userId: payload.userId || payload.data?.userId,
      workspaceId: payload.workspaceId || payload.data?.workspaceId,
      customerId: payload.customerId || payload.data?.customerId || `mock_cust_${Date.now()}`,
      subscriptionId: payload.subscriptionId || payload.data?.subscriptionId || `mock_sub_${Date.now()}`,
      planTier: (payload.planTier || payload.data?.planTier || 'pro') as any,
      status: (payload.status || payload.data?.status || 'active') as any,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rawPayload: payload,
    };
  }
}
