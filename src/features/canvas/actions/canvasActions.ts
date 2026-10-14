'use server';

import { getAuthenticatedUserId } from '@/lib/authUtils';
import { getActiveProfile } from '@/lib/dashboardServerActions';
import { generateCanvasBlocksFromChat, checkResearchAgentHealth } from '@/lib/geminiClient';
import { assertFeatureAllowed } from '@/lib/plans/featureGates';

import {
  getCanvasDataFromDb,
  instantiateCanvasTemplateInDb,
  addChatMessageToDb,
  getGlobalChatMessagesFromDb,
  updateCanvasChatHistoryInDb,
  addCanvasBlockToDb,
  updateCanvasBlockInDb,
  deleteCanvasBlockFromDb,
  addEdgeToDb,
  deleteEdgeFromDb,
  reorderCanvasBlocksInDb,
  clearCanvasInDb,
  createCanvasSessionInDb,
  getUserCanvasSessionsFromDb,
  updateCanvasSessionNameInDb,
  deleteCanvasSessionFromDb,
} from '@/db/queries/canvas';

export async function getCanvasModelProviderAction(): Promise<string> {
  const isAgentUp = await checkResearchAgentHealth();
  return isAgentUp ? 'research agent' : 'gemini';
}

export async function getCanvasDataAction(canvasId?: string, forceNewSession?: boolean, newSessionTitle?: string) {
  const userId = await getAuthenticatedUserId();
  return await getCanvasDataFromDb(userId, canvasId, forceNewSession, newSessionTitle);
}

export async function addChatMessageAction(message: any, canvasId?: string) {
  const userId = await getAuthenticatedUserId();
  await addChatMessageToDb(userId, message, canvasId);
}

export async function getGlobalChatMessagesAction() {
  const userId = await getAuthenticatedUserId();
  return await getGlobalChatMessagesFromDb(userId);
}

export async function updateCanvasChatHistoryAction(chatHistory: any[], canvasId?: string) {
  const userId = await getAuthenticatedUserId();
  await updateCanvasChatHistoryInDb(userId, chatHistory, canvasId);
}

export async function addCanvasBlockAction(
  block: { type: string; content: string; order: number; position?: { x: number; y: number }; title?: string },
  canvasId?: string
) {
  const userId = await getAuthenticatedUserId();
  return await addCanvasBlockToDb(userId, block, canvasId);
}

export async function updateCanvasBlockAction(id: string, updates: { content?: string; type?: string; position?: { x: number; y: number } }) {
  const userId = await getAuthenticatedUserId();
  await updateCanvasBlockInDb(userId, id, updates);
}

export async function addEdgeAction(edge: { source: string; target: string; label?: string }) {
  const userId = await getAuthenticatedUserId();
  return await addEdgeToDb(userId, edge);
}

export async function deleteEdgeAction(id: string) {
  const userId = await getAuthenticatedUserId();
  await deleteEdgeFromDb(userId, id);
}

export async function deleteCanvasBlockAction(id: string) {
  const userId = await getAuthenticatedUserId();
  await deleteCanvasBlockFromDb(userId, id);
}

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[], canvasId?: string) {
  const userId = await getAuthenticatedUserId();
  await reorderCanvasBlocksInDb(userId, blocks, canvasId);
}

export async function clearCanvasAction(canvasId?: string) {
  const userId = await getAuthenticatedUserId();
  await clearCanvasInDb(userId, canvasId);
}

export async function createCanvasSessionAction(name?: string) {
  const userId = await getAuthenticatedUserId();
  await assertFeatureAllowed(userId, 'canvas_sessions');
  return await createCanvasSessionInDb(userId, name || 'Untitled Canvas');
}

export async function getUserCanvasSessionsAction() {
  const userId = await getAuthenticatedUserId();
  return await getUserCanvasSessionsFromDb(userId);
}

export async function updateCanvasSessionNameAction(id: string, name: string) {
  const userId = await getAuthenticatedUserId();
  return await updateCanvasSessionNameInDb(userId, id, name);
}

export async function deleteCanvasSessionAction(id: string) {
  const userId = await getAuthenticatedUserId();
  await deleteCanvasSessionFromDb(userId, id);
  return true;
}

export async function generateCanvasChatResponseAction(
  input: string,
  history: any[] = [],
  files: { data: string; mimeType: string }[] = [],
  currentCanvas?: { blocks: any[], edges: any[] }
) {
  const userId = await getAuthenticatedUserId();
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
  const userId = await getAuthenticatedUserId();
  await assertFeatureAllowed(userId, 'canvas_sessions');
  return await instantiateCanvasTemplateInDb(userId, template);
}
