import { PlanTier } from './types';
import { PLANS } from './config';

export function getPlanConfig(planTier: PlanTier | string | null | undefined) {
  const normalizedTier = (planTier || 'free').toLowerCase() as PlanTier;
  return PLANS[normalizedTier] || PLANS.free;
}

export function canGenerateContent(planTier: PlanTier | string | null | undefined, currentCount: number): boolean {
  const limit = getPlanConfig(planTier).limits.generationsPerMonth;
  return limit === 'unlimited' || currentCount < limit;
}

export function canCreateBrandProfile(planTier: PlanTier | string | null | undefined, currentCount: number): boolean {
  const limit = getPlanConfig(planTier).limits.brandProfiles;
  return limit === 'unlimited' || currentCount < limit;
}

export function canCreateCanvasSession(planTier: PlanTier | string | null | undefined, currentCount: number): boolean {
  const limit = getPlanConfig(planTier).limits.canvasSessions;
  return limit === 'unlimited' || currentCount < limit;
}

export function canCreateSavedCampaign(planTier: PlanTier | string | null | undefined, currentCount: number): boolean {
  const limit = getPlanConfig(planTier).limits.savedCampaigns;
  return limit === 'unlimited' || currentCount < limit;
}

export function canInviteTeamMember(planTier: PlanTier | string | null | undefined, currentMembersCount: number): boolean {
  const limit = getPlanConfig(planTier).limits.teamMembers ?? 1;
  return limit === 'unlimited' || currentMembersCount < limit;
}

export function canUseCustomBranding(planTier: PlanTier | string | null | undefined): boolean {
  return getPlanConfig(planTier).limits.customBranding ?? false;
}

export function canUseScheduledPosts(planTier: PlanTier | string | null | undefined): boolean {
  return getPlanConfig(planTier).limits.scheduledPosts ?? false;
}
