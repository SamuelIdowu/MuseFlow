'use server';

import { getAuthenticatedUserId } from './authUtils';
import { getPlanTierOverride } from './featureFlags';
import { Profile } from '@/types/profile';
import { db } from '@/db';
import { ideaKernels } from '@/db/schema/ideas';
import { canvasSessions } from '@/db/schema/canvas';
import { savedCampaigns } from '@/db/schema/billing';
import { scheduledPosts } from '@/db/schema/schedule';
import { users } from '@/db/schema/users';
import { usageTracking } from '@/db/schema/billing';
import { eq, desc, asc, and } from 'drizzle-orm';
import { getDashboardStatsFromDb } from '@/db/queries/dashboard';
import { getActiveProfileFromDb, createProfileInDb } from '@/db/queries/profiles';

export interface RecentIdeaItem {
  id: string;
  topic: string;
  kernels: string[];
  inputType: string;
  createdAt: string;
}

export interface RecentCanvasItem {
  id: string;
  name: string;
  blockCount?: number;
  updatedAt: string;
}

export interface RecentCampaignItem {
  id: string;
  topic: string;
  platform: string;
  tone: string;
  postCount: number;
  createdAt: string;
}

export interface UpcomingPostItem {
  id: string;
  channel: string;
  scheduledTime: string;
  status: string;
  previewContent: string;
}

export interface UsageData {
  current: number;
  limit: number;
  plan: 'free' | 'pro' | 'business';
  percentage: number;
}

export interface DashboardOverviewData {
  stats: {
    ideasCount: number;
    contentCount?: number;
    canvasCount: number;
    scheduledCount: number;
    campaignsCount: number;
    profileCount: number;
  };
  activeProfile: Profile | null;
  recentIdeas: RecentIdeaItem[];
  recentCanvases: RecentCanvasItem[];
  recentCampaigns: RecentCampaignItem[];
  upcomingPosts: UpcomingPostItem[];
  usage: UsageData;
}

export async function getDashboardStats() {
  const userId = await getAuthenticatedUserId();
  return await getDashboardStatsFromDb(userId);
}

export async function getActiveProfile(): Promise<Profile | null> {
  try {
    const userId = await getAuthenticatedUserId();
    const profile = await getActiveProfileFromDb(userId);
    return profile as Profile | null;
  } catch (err) {
    console.error('Error in getActiveProfile:', err);
    return null;
  }
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  const userId = await getAuthenticatedUserId();

  // Parallel data fetching via Neon Drizzle queries
  const [
    stats,
    activeProfile,
    ideasRows,
    canvasesRows,
    campaignsRows,
    postsRows,
    userRow,
    usageRow
  ] = await Promise.all([
    getDashboardStatsFromDb(userId),
    getActiveProfileFromDb(userId),
    db.query.ideaKernels.findMany({
      where: eq(ideaKernels.userId, userId),
      orderBy: [desc(ideaKernels.createdAt)],
      limit: 6,
    }),
    db.query.canvasSessions.findMany({
      where: eq(canvasSessions.userId, userId),
      orderBy: [desc(canvasSessions.updatedAt)],
      limit: 4,
    }),
    db.query.savedCampaigns.findMany({
      where: eq(savedCampaigns.userId, userId),
      orderBy: [desc(savedCampaigns.createdAt)],
      limit: 4,
    }),
    db.query.scheduledPosts.findMany({
      where: eq(scheduledPosts.userId, userId),
      orderBy: [asc(scheduledPosts.scheduledTime)],
      limit: 4,
    }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db.query.usageTracking.findFirst({
      where: and(eq(usageTracking.userId, userId), eq(usageTracking.metric, 'ai_generations')),
      orderBy: [desc(usageTracking.periodStart)],
    }),
  ]);

  // Extract Recent Ideas
  const recentIdeas: RecentIdeaItem[] = ideasRows.map((item) => {
    let rawKernels: string[] = [];
    if (Array.isArray(item.kernels)) {
      rawKernels = item.kernels as string[];
    } else if (typeof item.kernels === 'string') {
      try {
        rawKernels = JSON.parse(item.kernels);
      } catch {
        rawKernels = [item.kernels];
      }
    }
    return {
      id: item.id,
      topic: item.inputData || 'Untitled Idea',
      kernels: rawKernels,
      inputType: item.inputType || 'text',
      createdAt: item.createdAt.toISOString(),
    };
  });

  // Extract Recent Canvases
  const recentCanvases: RecentCanvasItem[] = canvasesRows.map((canvas) => ({
    id: canvas.id,
    name: canvas.name || 'Untitled Canvas',
    updatedAt: (canvas.updatedAt || canvas.createdAt).toISOString(),
  }));

  // Extract Recent Campaigns
  const recentCampaigns: RecentCampaignItem[] = campaignsRows.map((c) => {
    let postCount = 0;
    if (Array.isArray(c.posts)) {
      postCount = c.posts.length;
    }
    return {
      id: c.id,
      topic: c.topic || 'Untitled Campaign',
      platform: c.platform || 'Multi-channel',
      tone: c.tone || 'General',
      postCount,
      createdAt: c.createdAt.toISOString(),
    };
  });

  // Extract Upcoming Scheduled Posts
  const upcomingPosts: UpcomingPostItem[] = postsRows.map((post) => {
    let preview = '';
    if (Array.isArray(post.contentBlocks) && post.contentBlocks.length > 0) {
      const firstBlock = post.contentBlocks[0] as any;
      preview = typeof firstBlock === 'string' ? firstBlock : firstBlock?.content || '';
    } else if (typeof post.contentBlocks === 'string') {
      preview = post.contentBlocks;
    }
    return {
      id: post.id,
      channel: post.channel || 'generic',
      scheduledTime: post.scheduledTime.toISOString(),
      status: post.status || 'scheduled',
      previewContent: preview.slice(0, 120),
    };
  });

  // Extract Usage & Plan
  let plan: 'free' | 'pro' | 'business' = 'free';
  const override = getPlanTierOverride();
  if (override) {
    plan = override === 'studio' ? 'business' : override;
  } else if (userRow?.subscriptionPlan) {
    const rawPlan = userRow.subscriptionPlan.toLowerCase();
    if (rawPlan.includes('business') || rawPlan.includes('studio')) plan = 'business';
    else if (rawPlan.includes('pro')) plan = 'pro';
  } else if (userRow?.planTier) {
    const rawPlan = userRow.planTier.toLowerCase();
    if (rawPlan.includes('business') || rawPlan.includes('studio')) plan = 'business';
    else if (rawPlan.includes('pro')) plan = 'pro';
  }

  const currentUsage = usageRow?.count || 0;
  const limitMap = { free: 25, pro: 500, business: 2500 };
  const limit = limitMap[plan] || 25;
  const percentage = Math.min(100, Math.round((currentUsage / limit) * 100));

  return {
    stats: {
      ideasCount: stats.ideasCount,
      canvasCount: stats.canvasCount,
      campaignsCount: stats.campaignsCount,
      scheduledCount: stats.scheduledCount,
      profileCount: stats.profileCount,
    },
    activeProfile: activeProfile as Profile | null,
    recentIdeas,
    recentCanvases,
    recentCampaigns,
    upcomingPosts,
    usage: {
      current: currentUsage,
      limit,
      plan,
      percentage,
    },
  };
}

export async function createQuickProfileAction(params: {
  profile_name: string;
  niche: string;
  tone_config?: {
    professionalism?: number;
    creativity?: number;
    casualness?: number;
    directness?: number;
  };
  is_active?: boolean;
}) {
  const userId = await getAuthenticatedUserId();

  return await createProfileInDb(userId, {
    profile_name: params.profile_name.trim(),
    niche: params.niche.trim(),
    tone_config: params.tone_config || {
      professionalism: 6,
      creativity: 7,
      casualness: 6,
      directness: 7,
    },
    is_active: params.is_active !== false,
  });
}