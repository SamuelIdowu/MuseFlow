'use server';

import { createClerkSupabaseClient } from './supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from './authUtils';
import { Profile } from '@/types/profile';

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
    canvasCount: number;
    campaignsCount: number;
    scheduledCount: number;
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
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();

  let ideasCount = 0;
  let contentCount = 0;
  let scheduledCount = 0;
  let profileCount = 0;
  let campaignsCount = 0;

  try {
    const [
      ideasRes,
      canvasRes,
      scheduledRes,
      profileRes,
      campaignsRes
    ] = await Promise.all([
      supabase.from('idea_kernels').select('*', { count: 'exact', head: true }).eq('user_id', supabaseUserId),
      supabase.from('canvas_sessions').select('*', { count: 'exact', head: true }).eq('user_id', supabaseUserId),
      supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', supabaseUserId),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_id', supabaseUserId),
      supabase.from('saved_campaigns').select('*', { count: 'exact', head: true }).eq('user_id', supabaseUserId)
    ]);

    ideasCount = ideasRes.count || 0;
    contentCount = canvasRes.count || 0;
    scheduledCount = scheduledRes.count || 0;
    profileCount = profileRes.count || 0;
    campaignsCount = campaignsRes.count || 0;
  } catch (error) {
    console.error('[getDashboardStats] Database error:', error);
  }

  return {
    ideasCount,
    contentCount,
    canvasCount: contentCount,
    scheduledCount,
    profileCount,
    campaignsCount
  };
}

export async function getActiveProfile(): Promise<Profile | null> {
  try {
    const supabaseUserId = await getAuthenticatedSupabaseUserId();
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active profile:', error);
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.error('Error in getActiveProfile:', err);
    return null;
  }
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();

  // Parallel data fetching for optimal performance
  const [
    statsData,
    activeProfileData,
    ideasRes,
    canvasesRes,
    campaignsRes,
    postsRes,
    userRes,
    usageTrackingRes
  ] = await Promise.allSettled([
    getDashboardStats(),
    getActiveProfile(),
    supabase
      .from('idea_kernels')
      .select('id, input_data, input_type, kernels, created_at')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('canvas_sessions')
      .select('id, name, updated_at, created_at')
      .eq('user_id', supabaseUserId)
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase
      .from('saved_campaigns')
      .select('id, topic, platform, tone, posts, created_at')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('scheduled_posts')
      .select('id, channel, scheduled_time, status, content_blocks, created_at')
      .eq('user_id', supabaseUserId)
      .order('scheduled_time', { ascending: true })
      .limit(4),
    supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', supabaseUserId)
      .maybeSingle(),
    supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', supabaseUserId)
      .eq('metric', 'ai_generations')
      .maybeSingle()
  ]);

  // Extract Stats
  const stats = statsData.status === 'fulfilled' ? statsData.value : {
    ideasCount: 0,
    contentCount: 0,
    canvasCount: 0,
    scheduledCount: 0,
    profileCount: 0,
    campaignsCount: 0
  };

  // Extract Active Profile
  const activeProfile = activeProfileData.status === 'fulfilled' ? activeProfileData.value : null;

  // Extract Recent Ideas
  let recentIdeas: RecentIdeaItem[] = [];
  if (ideasRes.status === 'fulfilled' && ideasRes.value.data) {
    recentIdeas = ideasRes.value.data.map((item: any) => {
      let rawKernels: string[] = [];
      if (Array.isArray(item.kernels)) {
        rawKernels = item.kernels;
      } else if (typeof item.kernels === 'string') {
        try {
          rawKernels = JSON.parse(item.kernels);
        } catch {
          rawKernels = [item.kernels];
        }
      }
      return {
        id: item.id,
        topic: item.input_data || 'Untitled Idea',
        kernels: rawKernels,
        inputType: item.input_type || 'text',
        createdAt: item.created_at
      };
    });
  }

  // Extract Recent Canvases
  let recentCanvases: RecentCanvasItem[] = [];
  if (canvasesRes.status === 'fulfilled' && canvasesRes.value.data) {
    recentCanvases = canvasesRes.value.data.map((canvas: any) => ({
      id: canvas.id,
      name: canvas.name || 'Untitled Canvas',
      updatedAt: canvas.updated_at || canvas.created_at
    }));
  }

  // Extract Recent Campaigns
  let recentCampaigns: RecentCampaignItem[] = [];
  if (campaignsRes.status === 'fulfilled' && campaignsRes.value.data) {
    recentCampaigns = campaignsRes.value.data.map((c: any) => {
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
        createdAt: c.created_at
      };
    });
  }

  // Extract Upcoming Scheduled Posts
  let upcomingPosts: UpcomingPostItem[] = [];
  if (postsRes.status === 'fulfilled' && postsRes.value.data) {
    upcomingPosts = postsRes.value.data.map((post: any) => {
      let preview = '';
      if (Array.isArray(post.content_blocks) && post.content_blocks.length > 0) {
        preview = typeof post.content_blocks[0] === 'string' 
          ? post.content_blocks[0] 
          : post.content_blocks[0]?.content || '';
      } else if (typeof post.content_blocks === 'string') {
        preview = post.content_blocks;
      }
      return {
        id: post.id,
        channel: post.channel || 'generic',
        scheduledTime: post.scheduled_time || post.created_at,
        status: post.status || 'scheduled',
        previewContent: preview.slice(0, 120)
      };
    });
  }

  // Extract Usage & Plan
  let plan: 'free' | 'pro' | 'business' = 'free';
  if (userRes.status === 'fulfilled' && userRes.value.data?.subscription_plan) {
    const rawPlan = userRes.value.data.subscription_plan.toLowerCase();
    if (rawPlan.includes('business')) plan = 'business';
    else if (rawPlan.includes('pro')) plan = 'pro';
  }

  const currentUsage = usageTrackingRes.status === 'fulfilled' ? usageTrackingRes.value.data?.count || 0 : 0;
  const limitMap = { free: 25, pro: 500, business: 2500 };
  const limit = limitMap[plan] || 25;
  const percentage = Math.min(100, Math.round((currentUsage / limit) * 100));

  return {
    stats: {
      ideasCount: stats.ideasCount,
      canvasCount: stats.canvasCount,
      campaignsCount: stats.campaignsCount,
      scheduledCount: stats.scheduledCount,
      profileCount: stats.profileCount
    },
    activeProfile,
    recentIdeas,
    recentCanvases,
    recentCampaigns,
    upcomingPosts,
    usage: {
      current: currentUsage,
      limit,
      plan,
      percentage
    }
  };
}