import {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  PortalParams,
  CancelSubscriptionParams,
  NormalizedWebhookEvent,
  WebhookEventType,
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

  async cancelSubscription(_params: CancelSubscriptionParams): Promise<boolean> {
    void _params;
    return true;
  }

  async parseWebhook(
    rawBody: string,
    _headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent> {
    void _headers;
    let payload: Record<string, unknown> = {};
    try {
      payload = typeof rawBody === 'string' && rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      payload = {};
    }

    const payloadData = payload.data as Record<string, unknown> | undefined;

    return {
      provider: 'mock',
      eventId: (payload.id as string) || `mock_event_${Date.now()}`,
      eventType: ((payload.type as WebhookEventType) || 'subscription.created'),
      userId: (payload.userId as string) || (payloadData?.userId as string),
      workspaceId: (payload.workspaceId as string) || (payloadData?.workspaceId as string),
      customerId: (payload.customerId as string) || (payloadData?.customerId as string) || `mock_cust_${Date.now()}`,
      subscriptionId: (payload.subscriptionId as string) || (payloadData?.subscriptionId as string) || `mock_sub_${Date.now()}`,
      planTier: ((payload.planTier || payloadData?.planTier || 'pro') as NormalizedWebhookEvent['planTier']),
      status: ((payload.status || payloadData?.status || 'active') as NormalizedWebhookEvent['status']),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rawPayload: payload,
    };
  }
}
