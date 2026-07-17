'use server';

import { createClerkSupabaseClient } from '@/lib/supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from '@/lib/authUtils';
import { canvasRepository } from '../repositories/canvasRepository';
import { getActiveProfile } from '@/lib/dashboardServerActions';
import { generateCanvasBlocksFromChat } from '@/lib/geminiClient';

export async function getCanvasDataAction(canvasId?: string) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.getCanvasData(supabase, userId, canvasId);
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

export async function addCanvasBlockAction(block: { type: string; content: string; order: number; position?: { x: number; y: number } }) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.addCanvasBlock(supabase, userId, block);
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

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[]) {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.reorderCanvasBlocks(supabase, userId, blocks);
}

export async function clearCanvasAction() {
  const userId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();
  return canvasRepository.clearCanvas(supabase, userId);
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
