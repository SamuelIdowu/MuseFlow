'use server';

import { getAuthenticatedUserId } from '@/lib/authUtils';
import {
  getUserEffectivePlan,
  checkFeatureAccess,
  FeatureKey,
  FeatureAccessResult,
} from './featureGates';
import { PlanTier } from '@/lib/payments/types';

export interface PlanGateSummary {
  plan: PlanTier;
  isPaid: boolean;
  features: Record<FeatureKey, FeatureAccessResult>;
}

export async function getPlanGateSummaryAction(): Promise<PlanGateSummary> {
  const userId = await getAuthenticatedUserId();
  const plan = await getUserEffectivePlan(userId);

  const featureKeys: FeatureKey[] = [
    'scheduled_posts',
    'canvas_sessions',
    'ai_generations',
    'brand_profiles',
    'saved_campaigns',
  ];

  const results = await Promise.all(
    featureKeys.map((key) => checkFeatureAccess(userId, key))
  );

  const features = results.reduce((acc, res) => {
    acc[res.feature] = res;
    return acc;
  }, {} as Record<FeatureKey, FeatureAccessResult>);

  return {
    plan,
    isPaid: plan !== 'free',
    features,
  };
}

export async function checkFeatureGateAction(feature: FeatureKey): Promise<FeatureAccessResult> {
  const userId = await getAuthenticatedUserId();
  return await checkFeatureAccess(userId, feature);
}
