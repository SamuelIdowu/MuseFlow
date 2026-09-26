'use server';

import { createClerkSupabaseClient } from '@/lib/supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { ideaRepository } from '../repositories/ideaRepository';

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
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await getRecentIdeasFromDb(userId, limit);
    } catch (err) {
      console.warn('[getRecentIdeas] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getRecentIdeas(supabase, userId, limit);
}

export async function getRecentChats(limit: number = 20) {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await getRecentChatsFromDb(userId, limit);
    } catch (err) {
      console.warn('[getRecentChats] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getRecentChats(supabase, userId, limit);
}

export async function getChatById(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      const chat = await getChatByIdFromDb(userId, id);
      if (chat) return chat;
    } catch (err) {
      console.warn('[getChatById] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getChatById(supabase, userId, id);
}

export async function getUserIdeasAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await getUserIdeasFromDb(userId);
    } catch (err) {
      console.warn('[getUserIdeasAction] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getUserIdeas(supabase, userId);
}

export async function saveToIdeasAction(content: string, title?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await saveToIdeasInDb(userId, content, title);
    } catch (err) {
      console.warn('[saveToIdeasAction] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.saveToIdeas(supabase, userId, content, title);
}

export async function deleteIdeaAction(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await deleteIdeaFromDb(userId, id);
    } catch (err) {
      console.warn('[deleteIdeaAction] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.deleteIdea(supabase, userId, id);
}

export async function deleteAllChatsAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await deleteAllChatsFromDb(userId);
    } catch (err) {
      console.warn('[deleteAllChatsAction] Neon error, falling back to Supabase:', err);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.deleteAllChats(supabase, userId);
}

export async function generateChatIdeaAction(params: {
  inputText: string;
  contentType?: string;
  activeProfile?: any;
  history?: any[];
}) {
  const userId = await getAuthenticatedSupabaseUserId();
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
