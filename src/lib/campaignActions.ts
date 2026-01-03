'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { getActiveProfile } from './dashboardServerActions';
import { generateCampaignContent } from './geminiClient';
import { createSupabaseServiceClient, ensureSupabaseUser } from './supabaseServerClient';

interface CampaignPost {
    content: string;
    type: string;
}

export interface SavedCampaign {
    id: string;
    user_id: string;
    topic: string;
    platform: string;
    tone: string;
    posts: CampaignPost[];
    created_at: string;
}

export async function generateCampaignAction(topic: string, count: number, platform: string, tone: string, userInstruction: string, context: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('User not authenticated');

    // Verify user exists/has email by calling getActiveProfile
    // getActiveProfile handles auth checks and Supabase user verification internally
    const activeProfile = await getActiveProfile();

    return await generateCampaignContent(topic, activeProfile, count, platform, tone, userInstruction, context);
}

export async function saveCampaignAction(
    topic: string,
    platform: string,
    tone: string,
    posts: CampaignPost[]
): Promise<SavedCampaign> {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) throw new Error('User not authenticated');

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error('User has no email address');

    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
        .from('saved_campaigns')
        .insert({
            user_id: supabaseUserId,
            topic,
            platform,
            tone,
            posts: JSON.parse(JSON.stringify(posts)),
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving campaign:', error);
        throw new Error('Failed to save campaign');
    }

    return {
        ...data,
        posts: data.posts as unknown as CampaignPost[],
    };
}

export async function getSavedCampaignsAction(): Promise<SavedCampaign[]> {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) throw new Error('User not authenticated');

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error('User has no email address');

    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
        .from('saved_campaigns')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching saved campaigns:', error);
        throw new Error('Failed to fetch saved campaigns');
    }

    return (data || []).map(campaign => ({
        ...campaign,
        posts: campaign.posts as unknown as CampaignPost[],
    }));
}

export async function deleteSavedCampaignAction(id: string): Promise<void> {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) throw new Error('User not authenticated');

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error('User has no email address');

    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
        .from('saved_campaigns')
        .delete()
        .eq('id', id)
        .eq('user_id', supabaseUserId);

    if (error) {
        console.error('Error deleting saved campaign:', error);
        throw new Error('Failed to delete saved campaign');
    }
}
