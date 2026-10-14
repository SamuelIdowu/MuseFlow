'use server';

import { auth } from '@clerk/nextjs/server';
import { getActiveProfile } from './dashboardServerActions';
import { generateCampaignContent } from './geminiClient';
import { getAuthenticatedUserId } from './authUtils';

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

    const activeProfile = await getActiveProfile();

    return await generateCampaignContent(topic, activeProfile, count, platform, tone, userInstruction, context);
}

import {
    saveCampaignInDb,
    getSavedCampaignsFromDb,
    deleteSavedCampaignFromDb,
} from '@/db/queries/campaigns';

export async function saveCampaignAction(
    topic: string,
    platform: string,
    tone: string,
    posts: CampaignPost[]
): Promise<SavedCampaign> {
    const userId = await getAuthenticatedUserId();
    return await saveCampaignInDb(userId, topic, platform, tone, posts);
}

export async function getSavedCampaignsAction(): Promise<SavedCampaign[]> {
    const userId = await getAuthenticatedUserId();
    return await getSavedCampaignsFromDb(userId);
}

export async function deleteSavedCampaignAction(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    await deleteSavedCampaignFromDb(userId, id);
}
