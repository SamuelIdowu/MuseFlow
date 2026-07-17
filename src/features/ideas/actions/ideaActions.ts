'use server';

import { createClerkSupabaseClient } from '@/lib/supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { ideaRepository } from '../repositories/ideaRepository';

export async function getRecentIdeas(limit: number = 3) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getRecentIdeas(supabase, userId, limit);
}

export async function getRecentChats(limit: number = 20) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getRecentChats(supabase, userId, limit);
}

export async function getChatById(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getChatById(supabase, userId, id);
}

export async function getUserIdeasAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.getUserIdeas(supabase, userId);
}

export async function saveToIdeasAction(content: string, title?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.saveToIdeas(supabase, userId, content, title);
}

export async function deleteIdeaAction(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.deleteIdea(supabase, userId, id);
}

export async function deleteAllChatsAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return ideaRepository.deleteAllChats(supabase, userId);
}
