'use server';

import { createClerkSupabaseClient } from '@/lib/supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { canvasRepository } from '../repositories/canvasRepository';
import { getActiveProfile } from '@/lib/dashboardServerActions';
import { generateCanvasBlocksFromChat, checkResearchAgentHealth } from '@/lib/geminiClient';
import { assertFeatureAllowed } from '@/lib/plans/featureGates';

export async function getCanvasModelProviderAction(): Promise<string> {
  const isAgentUp = await checkResearchAgentHealth();
  return isAgentUp ? 'research agent' : 'gemini';
}

import { getCanvasDataFromDb, instantiateCanvasTemplateInDb } from '@/db/queries/canvas';

export async function getCanvasDataAction(canvasId?: string, forceNewSession?: boolean, newSessionTitle?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  if (process.env.DATABASE_URL) {
    try {
      return await getCanvasDataFromDb(userId, canvasId, forceNewSession, newSessionTitle);
    } catch (dbErr) {
      console.warn('[getCanvasDataAction] Neon query error, falling back to Supabase:', dbErr);
    }
  }
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.getCanvasData(supabase, userId, canvasId, forceNewSession, newSessionTitle);
}

export async function addChatMessageAction(message: any, canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.addChatMessage(supabase, userId, message, canvasId);
}

export async function getGlobalChatMessagesAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.getGlobalChatMessages(supabase, userId);
}

export async function updateCanvasChatHistoryAction(chatHistory: any[], canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.updateCanvasChatHistory(supabase, userId, chatHistory, canvasId);
}

export async function addCanvasBlockAction(block: { type: string; content: string; order: number; position?: { x: number; y: number } }, canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.addCanvasBlock(supabase, userId, block, canvasId);
}

export async function updateCanvasBlockAction(id: string, updates: { content?: string; type?: string; position?: { x: number; y: number } }) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.updateCanvasBlock(supabase, userId, id, updates);
}

export async function addEdgeAction(edge: { source: string; target: string; label?: string }) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.addEdge(supabase, userId, edge);
}

export async function deleteEdgeAction(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.deleteEdge(supabase, userId, id);
}

export async function deleteCanvasBlockAction(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.deleteCanvasBlock(supabase, userId, id);
}

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[], canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.reorderCanvasBlocks(supabase, userId, blocks, canvasId);
}

export async function clearCanvasAction(canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.clearCanvas(supabase, userId, canvasId);
}

export async function createCanvasSessionAction(name?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  await assertFeatureAllowed(userId, 'canvas_sessions');
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.createCanvasSession(supabase, userId, name || 'Untitled Canvas');
}

export async function getUserCanvasSessionsAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.getUserCanvasSessions(supabase, userId);
}

export async function updateCanvasSessionNameAction(id: string, name: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.updateCanvasSessionName(supabase, userId, id, name);
}

export async function deleteCanvasSessionAction(id: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.deleteCanvasSession(supabase, userId, id);
}

export async function generateCanvasChatResponseAction(
  input: string,
  history: any[] = [],
  files: { data: string; mimeType: string }[] = [],
  currentCanvas?: { blocks: any[], edges: any[] }
) {
  const userId = await getAuthenticatedSupabaseUserId();
  await assertFeatureAllowed(userId, 'ai_generations');

  const profile = await getActiveProfile();
  const response = await generateCanvasBlocksFromChat(input, profile, history, files, currentCanvas);

  const { incrementUsage } = await import('@/lib/usage');
  incrementUsage(userId, 'ai_generations').catch(console.warn);

  return response;
}

export async function instantiateCanvasTemplateAction(template: {
  title: string;
  blocks: Array<{ tempId: string; type: string; content: string; x: number; y: number }>;
  edges: Array<{ source: string; target: string; label?: string }>;
}) {
  const userId = await getAuthenticatedSupabaseUserId();
  await assertFeatureAllowed(userId, 'canvas_sessions');

  if (process.env.DATABASE_URL) {
    try {
      return await instantiateCanvasTemplateInDb(userId, template);
    } catch (neonErr) {
      console.warn('[instantiateCanvasTemplateAction] Neon instantiation error, falling back to Supabase:', neonErr);
    }
  }

  const supabase = await createClerkSupabaseClient();
  return canvasRepository.instantiateCanvasTemplate(supabase, userId, template);
}
