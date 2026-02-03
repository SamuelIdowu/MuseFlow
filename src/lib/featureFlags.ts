/**
 * Feature Flags Configuration
 * 
 * This file contains global feature flags that can be toggled to enable/disable
 * features across the entire application.
 */

export const FEATURES = {
  /**
   * PAYMENTS_ENABLED
   * 
   * Controls whether the payment/subscription system is active.
   * 
   * When false:
   * - All users get full "business" plan access
   * - Usage limits are bypassed
   * - Payment UI is hidden or shows appropriate messaging
   * - Flutterwave API routes return gracefully
   * - All payment code is preserved but inactive
   * 
   * When true:
   * - Normal payment flow is active
   * - Usage limits are enforced
   * - Subscription tiers work as designed
   * 
   * To re-enable payments: Change this to `true`
   */
  PAYMENTS_ENABLED: false,
} as const;
