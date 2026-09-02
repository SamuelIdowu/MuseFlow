export type PlanTier = 'free' | 'pro' | 'studio' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete' | 'none';

export interface CreateCheckoutParams {
  workspaceId?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planTier: 'pro' | 'studio' | 'business';
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId?: string;
}

export interface PortalParams {
  customerId?: string;
  subscriptionId?: string;
  userId?: string;
  returnUrl: string;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  userId?: string;
  reason?: string;
}

export type WebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'unknown';

export interface NormalizedWebhookEvent {
  provider: string;
  eventId: string;
  eventType: WebhookEventType;
  workspaceId?: string;
  userId?: string;
  userEmail?: string;
  customerId?: string;
  subscriptionId?: string;
  planTier?: PlanTier;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date;
  rawPayload: Record<string, unknown>;
}

export interface PlanLimits {
  generationsPerMonth: number | 'unlimited';
  brandProfiles: number | 'unlimited';
  canvasSessions: number | 'unlimited';
  savedCampaigns: number | 'unlimited';
  clients?: number | 'unlimited';
  teamMembers?: number | 'unlimited';
  customBranding: boolean;
  scheduledPosts?: boolean;
  prioritySupport?: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: PlanLimits;
  productIds?: {
    paystack?: { monthly?: string; yearly?: string };
    paddle?: { monthly?: string; yearly?: string };
    dodo?: { monthly?: string; yearly?: string };
    polar?: { monthly?: string; yearly?: string };
    creem?: { monthly?: string; yearly?: string };
    stripe?: { monthly?: string; yearly?: string };
    flutterwave?: { monthly?: string; yearly?: string };
  };
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  getPortalUrl(params: PortalParams): Promise<string | null>;
  cancelSubscription?(params: CancelSubscriptionParams): Promise<boolean>;
  parseWebhook(
    rawBody: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedWebhookEvent>;
}
