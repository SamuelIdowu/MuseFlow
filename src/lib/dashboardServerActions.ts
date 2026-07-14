'use server';


import { auth, currentUser } from '@clerk/nextjs/server';
import { Database } from './database.types';
import { createSupabaseServiceClient, ensureSupabaseUser, getSupabaseUserId } from './supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from './authUtils';
import { Profile } from '@/types/profile';
import { generateCampaignContent, generateCanvasBlocksFromChat } from './geminiClient';
import { ideaRepository } from '../features/ideas/repositories/ideaRepository';
import { canvasRepository } from '../features/canvas/repositories/canvasRepository';




export async function getDashboardStats() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  // Create Supabase service client (bypasses RLS to avoid UUID/String type mismatch in policies)
  const supabase = createSupabaseServiceClient();

  let ideasCount = 0;
  let contentCount = 0;
  let scheduledCount = 0;
  let profileCount = 0;

  try {
    // Get idea count
    console.log('[getDashboardStats] Fetching ideas count for user:', supabaseUserId);
    const { count: ideasCountResult, error: ideasError } = await supabase
      .from('idea_kernels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (ideasError) {
      console.error('[getDashboardStats] Error fetching ideas count:', {
        message: ideasError.message,
        details: ideasError.details,
        hint: ideasError.hint,
        code: ideasError.code,
      });
      throw new Error('Could not fetch ideas count');
    }
    ideasCount = ideasCountResult || 0;
    console.log('[getDashboardStats] Ideas count:', ideasCount);

    // Get canvas sessions count (as content pieces)
    const { count: contentCountResult, error: contentError } = await supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (contentError) {
      console.error('Error fetching content count:', contentError);
      throw new Error('Could not fetch content count');
    }
    contentCount = contentCountResult || 0;

    // Get scheduled posts count
    const { count: scheduledCountResult, error: scheduledError } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (scheduledError) {
      console.error('Error fetching scheduled posts count:', scheduledError);
      throw new Error('Could not fetch scheduled posts count');
    }
    scheduledCount = scheduledCountResult || 0;

    // Get profile count (should be 1 per user, but counting for consistency)
    const { count: profileCountResult, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (profileError) {
      console.error('Error fetching profile count:', profileError);
      throw new Error('Could not fetch profile count');
    }
    profileCount = profileCountResult || 0;
  } catch (error) {
    console.error('[getDashboardStats] Database error:', error);

    // Check if this is a fetch error
    if (error instanceof Error) {
      console.error('[getDashboardStats] Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      });

      // Detect specific fetch-related errors
      if (error.message.includes('fetch failed')) {
        console.error('[getDashboardStats] FETCH FAILURE DETECTED - Possible causes:');
        console.error('  1. Supabase instance may be paused (common in free tier after inactivity)');
        console.error('  2. Network connectivity issues');
        console.error('  3. Invalid Supabase URL in environment variables');
        console.error('  4. Firewall or proxy blocking the connection');
        console.error('  → Check your Supabase dashboard to ensure the project is active');
        console.error('  → Verify NEXT_PUBLIC_SUPABASE_URL in .env.local is correct');
      }
    }

    throw new Error('Could not fetch dashboard statistics');
  }

  return {
    ideasCount,
    contentCount,
    scheduledCount,
    profileCount,
  };
}

export async function getRecentIdeas(limit: number = 3) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.getRecentIdeas(supabase, supabaseUserId, limit);
}

export async function getRecentChats(limit: number = 20) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.getRecentChats(supabase, supabaseUserId, limit);
}

export async function getChatById(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.getChatById(supabase, supabaseUserId, id);
}

export async function getCanvasDataAction(canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.getCanvasData(supabase, supabaseUserId, canvasId);
}

export async function addChatMessageAction(message: any, canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.addChatMessage(supabase, supabaseUserId, message, canvasId);
}

export async function getGlobalChatMessagesAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.getGlobalChatMessages(supabase, supabaseUserId);
}

export async function updateCanvasChatHistoryAction(chatHistory: any[], canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.updateCanvasChatHistory(supabase, supabaseUserId, chatHistory, canvasId);
}

export async function addCanvasBlockAction(block: { type: string; content: string; order: number; position?: { x: number; y: number } }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.addCanvasBlock(supabase, supabaseUserId, block);
}

export async function updateCanvasBlockAction(id: string, updates: { content?: string; type?: string; position?: { x: number; y: number } }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.updateCanvasBlock(supabase, supabaseUserId, id, updates);
}

export async function addEdgeAction(edge: { source: string; target: string; label?: string }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.addEdge(supabase, supabaseUserId, edge);
}

export async function deleteEdgeAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.deleteEdge(supabase, supabaseUserId, id);
}

export async function deleteCanvasBlockAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.deleteCanvasBlock(supabase, supabaseUserId, id);
}

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[]) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.reorderCanvasBlocks(supabase, supabaseUserId, blocks);
}

export async function getUserIdeasAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.getUserIdeas(supabase, supabaseUserId);
}

export async function getActiveProfile(): Promise<Profile | null> {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();

  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUserId)
    .eq('is_active', true)
    .single();

  if (error) {
    // If no active profile found, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching active profile:', error);
    throw new Error('Failed to fetch active profile');
  }

  return data as Profile;
}

export async function clearCanvasAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return canvasRepository.clearCanvas(supabase, supabaseUserId);
}

export async function saveToIdeasAction(content: string, title?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.saveToIdeas(supabase, supabaseUserId, content, title);
}

export async function deleteIdeaAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.deleteIdea(supabase, supabaseUserId, id);
}

export async function deleteAllChatsAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();
  return ideaRepository.deleteAllChats(supabase, supabaseUserId);
}

export async function generateCanvasChatResponseAction(
  input: string,
  history: any[] = [],
  files: { data: string; mimeType: string }[] = [],
  currentCanvas?: { blocks: any[], edges: any[] }
) {
  const profile = await getActiveProfile();
  return await generateCanvasBlocksFromChat(input, profile, history, files, currentCanvas);
}