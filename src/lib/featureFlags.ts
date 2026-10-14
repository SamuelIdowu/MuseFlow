/**
 * Feature Flags Configuration
 * 
 * This file contains global feature flags that can be toggled to enable/disable
 * features across the entire application.
 */

import { PlanTier } from './payments/types';

export type PlanTierOverride = PlanTier | null;

/**
 * Returns the plan tier override from environment variables if set.
 * Supported environment variables (in order of priority):
 * - NEXT_PUBLIC_APP_PLAN_TIER
 * - APP_PLAN_OVERRIDE
 * - NEXT_PUBLIC_PLAN_OVERRIDE
 * 
 * Valid values: 'free' | 'pro' | 'studio' | 'business'
 * (Aliases: 'starter' -> 'free', 'freelancer' -> 'pro', 'agency' -> 'business')
 * Any other value or unset returns `null` (defer to database/user subscription).
 */
export function getPlanTierOverride(): PlanTierOverride {
  const envVal = (
    process.env.NEXT_PUBLIC_APP_PLAN_TIER ||
    process.env.APP_PLAN_OVERRIDE ||
    process.env.NEXT_PUBLIC_PLAN_OVERRIDE ||
    ''
  ).toLowerCase().trim();

  if (!envVal || envVal === 'auto' || envVal === 'none' || envVal === 'disabled') {
    return null;
  }

  if (envVal === 'free' || envVal === 'starter') return 'free';
  if (envVal === 'pro' || envVal === 'freelancer') return 'pro';
  if (envVal === 'studio') return 'studio';
  if (envVal === 'business' || envVal === 'agency') return 'business';

  return null;
}

export const FEATURES = {
  /**
   * PAYMENTS_ENABLED
   * 
   * Controls whether the payment/subscription system is active.
   */
  PAYMENTS_ENABLED: false,

  /**
   * ENFORCE_PLAN_LIMITS
   * 
   * Controls whether plan feature gates, blockers, and usage limits are active.
   * When true, free-tier limits (3 canvases, no scheduling, 25 generations) are actively enforced
   * and paywall modals are triggered.
   */
  ENFORCE_PLAN_LIMITS: true,

  /**
   * Active plan tier override from environment variable, if configured.
   */
  get PLAN_OVERRIDE(): PlanTierOverride {
    return getPlanTierOverride();
  },
} as const;

