'use server';

import { getAuthenticatedUserId } from '@/lib/authUtils';
import type { Profile } from '@/types/profile';

import {
  getRecentIdeasFromDb,
  getRecentChatsFromDb,
  getChatByIdFromDb,
  getUserIdeasFromDb,
  saveToIdeasInDb,
  deleteIdeaFromDb,
  deleteAllChatsFromDb,
} from '@/db/queries/ideas';

export async function getRecentIdeas(limit: number = 3) {
  const userId = await getAuthenticatedUserId();
  return await getRecentIdeasFromDb(userId, limit);
}

export async function getRecentChats(limit: number = 20) {
  const userId = await getAuthenticatedUserId();
  return await getRecentChatsFromDb(userId, limit);
}

export async function getChatById(id: string) {
  const userId = await getAuthenticatedUserId();
  return await getChatByIdFromDb(userId, id);
}

export async function getUserIdeasAction() {
  const userId = await getAuthenticatedUserId();
  return await getUserIdeasFromDb(userId);
}

export async function saveToIdeasAction(content: string, title?: string) {
  const userId = await getAuthenticatedUserId();
  return await saveToIdeasInDb(userId, content, title);
}

export async function deleteIdeaAction(id: string) {
  const userId = await getAuthenticatedUserId();
  return await deleteIdeaFromDb(userId, id);
}

export async function deleteAllChatsAction() {
  const userId = await getAuthenticatedUserId();
  return await deleteAllChatsFromDb(userId);
}

export async function generateChatIdeaAction(params: {
  inputText: string;
  contentType?: string;
  activeProfile?: Profile | null;
  history?: Array<{ role: string; content: string }>;
}) {
  const userId = await getAuthenticatedUserId();
  const { assertFeatureAllowed } = await import('@/lib/plans/featureGates');
  await assertFeatureAllowed(userId, 'ai_generations');

  const { generateChatResponse } = await import('@/lib/geminiClient');
  const generatedContent = await generateChatResponse(
    params.inputText,
    params.activeProfile,
    params.history || [],
    params.contentType
  );

  const { incrementUsage } = await import('@/lib/usage');
  incrementUsage(userId, 'ai_generations').catch(console.warn);

  return { generatedContent };
}
