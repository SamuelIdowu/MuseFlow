'use server';


import { auth, currentUser } from '@clerk/nextjs/server';
import { Database } from './database.types';
import { createSupabaseServiceClient, ensureSupabaseUser, getSupabaseUserId } from './supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from './authUtils';
import { Profile } from '@/types/profile';
import { generateCampaignContent, generateCanvasBlocksFromChat } from './geminiClient';




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

export async function getRecentIdeas(limit = 3) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  // Create Supabase service client (bypasses RLS to avoid UUID/String type mismatch in policies)
  const supabase = createSupabaseServiceClient();

  let ideas = [];

  try {
    // Get recent idea kernels
    const { data: ideasData, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !ideasData) {
      console.error('Error fetching recent ideas:', error);
      throw new Error('Could not fetch recent ideas');
    }

    ideas = ideasData;
  } catch (error) {
    console.error('Database error in getRecentIdeas:', error);
    throw new Error('Could not fetch recent ideas');
  }

  // Transform the data to have a flat list of ideas with their metadata
  type IdeaKernel = Database['public']['Tables']['idea_kernels']['Row'];
  const recentIdeas = (ideas as IdeaKernel[]).flatMap(idea =>
    (idea.kernels as string[]).map((kernel: string, index: number) => ({
      id: `${idea.id}-${index}`,
      title: kernel,
      createdAt: idea.created_at,
      inputData: idea.input_data,
      inputType: idea.input_type,
    }))
  ).slice(0, limit); // Limit again after flattening

  return recentIdeas;
}

export async function getRecentChats(limit = 20) {
  let supabaseUserId: string;
  try {
    supabaseUserId = await getAuthenticatedSupabaseUserId();
  } catch (e) {
    return [];
  }


  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .select('id, input_data, created_at')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent chats:', error);
    return [];
  }

  return data.map(chat => ({
    id: chat.id,
    title: chat.input_data.length > 40 ? chat.input_data.substring(0, 40) + '...' : chat.input_data,
    createdAt: chat.created_at
  }));
}

export async function getChatById(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .select('*')
    .eq('id', id)
    .eq('user_id', supabaseUserId)
    .single();

  if (error || !data) {
    return null;
  }

  // Transform to Message[]
  // Legacy support: kernels might be string[] or Message[]
  // We need to standardize on return.
  let messages: any[] = [];

  // Initial User Message (Title)
  messages.push({
    id: 'msg-0',
    role: 'user',
    content: data.input_data,
    timestamp: new Date(data.created_at)
  });

  const kernels = data.kernels as any[];
  if (Array.isArray(kernels)) {
    kernels.forEach((k: any, index: number) => {
      if (typeof k === 'string') {
        // Legacy: It's just an AI response text
        messages.push({
          id: `msg-ai-${index}`,
          role: 'assistant',
          content: k,
          type: 'text',
          timestamp: new Date(data.created_at) // Approximate
        });
      } else if (k.role && k.content) {
        // New format: Message object
        messages.push({
          id: k.id || `msg-${index + 1}`,
          role: k.role,
          content: k.content,
          type: k.type || 'text',
          timestamp: k.timestamp ? new Date(k.timestamp) : new Date(data.created_at)
        });
      }
    });
  }

  return {
    id: data.id,
    messages
  };
}

export async function getCanvasDataAction(canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();

  // Get or create canvas session
  let canvasSession;

  if (canvasId) {
    const { data, error } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("id", canvasId)
      .eq("user_id", supabaseUserId)
      .single();

    if (!error && data) {
      canvasSession = data;
    }
  }

  if (!canvasSession) {
    const { data: existingSessions, error: sessionError } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error("Error fetching canvas sessions:", sessionError);
      throw new Error('Failed to fetch canvas sessions');
    }

    if (existingSessions && existingSessions.length > 0) {
      canvasSession = existingSessions[0];
    } else {
      // Create a new canvas session
      const { data: newSession, error: createError } = await supabase
        .from("canvas_sessions")
        .insert([{
          user_id: supabaseUserId,
          name: "New Canvas",
        }])
        .select()
        .single();

      if (createError) {
        console.error("Error creating canvas session:", createError);
        throw new Error('Failed to create canvas session');
      }
      canvasSession = newSession;
    }
  }

  // Fetch canvas blocks
  const { data: blocksData, error: blocksError } = await supabase
    .from("canvas_blocks")
    .select("*")
    .eq("canvas_id", canvasSession.id)
    .order("order_index", { ascending: true });

  if (blocksError) {
    console.error("Error fetching canvas blocks:", blocksError);
    throw new Error('Failed to fetch canvas blocks');
  }

  // Fetch canvas edges
  const { data: edgesData, error: edgesError } = await supabase
    .from("canvas_edges")
    .select("*")
    .eq("canvas_id", canvasSession.id);

  if (edgesError) {
    console.error("Error fetching canvas edges:", edgesError);
    // Don't fail completely if edges fail, just return empty?
    // adhering to strict error handling for now
    throw new Error('Failed to fetch canvas edges');
  }

  // Fetch chat history from chat_messages table
  const { data: chatMessagesData, error: chatError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("canvas_id", canvasSession.id)
    .order("created_at", { ascending: true });

  if (chatError) {
    console.error("Error fetching chat messages:", chatError);
  }

  const chatHistory = (chatMessagesData || []).map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at,
    toolInvocations: msg.tool_invocations || undefined,
  }));

  return {
    id: canvasSession.id,
    blocks: blocksData.map((block) => ({
      id: block.id,
      type: block.type || "paragraph",
      content: block.content,
      order: block.order_index,
      position: { x: block.position_x || 0, y: block.position_y || 0 }, // Default to 0,0
    })),
    edges: edgesData.map((edge) => ({
      id: edge.id,
      source: edge.source_block_id,
      target: edge.target_block_id,
      label: edge.label,
    })),
    chatHistory
  };
}

export async function addChatMessageAction(message: any, canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("chat_messages")
    .insert([{
      id: message.id, // Usually the Vercel AI SDK provides a UUID or string
      user_id: supabaseUserId,
      canvas_id: canvasId || null,
      role: message.role,
      content: message.content || '',
      tool_invocations: message.toolInvocations || null,
      created_at: message.createdAt || new Date().toISOString()
    }]);

  if (error) {
    console.error('Error inserting chat message:', error);
    throw new Error('Failed to insert chat message');
  }
}

export async function getGlobalChatMessagesAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", supabaseUserId)
    .is("canvas_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error('Error fetching global chat messages:', error);
    return [];
  }

  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at,
    toolInvocations: msg.tool_invocations || undefined,
  }));
}

export async function updateCanvasChatHistoryAction(chatHistory: any[], canvasId?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = createSupabaseServiceClient();

  let targetCanvasId = canvasId;

  if (!targetCanvasId) {
    // Get current canvas session
    const { data: sessions } = await supabase
      .from("canvas_sessions")
      .select("id")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
    targetCanvasId = sessions[0].id;
  }

  // To maintain backward compatibility during migration, we'll clear the chat history and reinsert it all
  await supabase.from("chat_messages").delete().eq("canvas_id", targetCanvasId).eq("user_id", supabaseUserId);
  
  if (chatHistory.length > 0) {
    const { error } = await supabase.from("chat_messages").insert(
      chatHistory.map(message => ({
        id: message.id || crypto.randomUUID(),
        user_id: supabaseUserId,
        canvas_id: targetCanvasId,
        role: message.role,
        content: message.content || '',
        tool_invocations: message.toolInvocations || message.toolCalls || null,
        created_at: message.createdAt || message.timestamp || new Date().toISOString()
      }))
    );

    if (error) {
      console.error('Error updating chat history:', error);
      throw new Error('Failed to update chat history');
    }
  }
}

function sanitizeBlockType(type?: string): string {
  if (!type) return 'paragraph';
  const clean = type.toLowerCase().trim().replace(/_/g, '-');
  
  if (['hook', 'problem', 'solution', 'paragraph', 'heading', 'quote', 'list'].includes(clean)) {
    return clean;
  }
  
  if (clean === 'call-to-action' || clean === 'cta' || clean === 'call_to_action') {
    return 'call-to-action';
  }
  
  if (clean.includes('list') || clean.includes('bullet') || clean === 'bullets') {
    return 'list';
  }
  
  if (clean === 'title' || clean.includes('header')) {
    return 'heading';
  }
  
  if (clean === 'testimonial') {
    return 'quote';
  }
  
  if (clean === 'text') {
    return 'paragraph';
  }
  
  return 'paragraph';
}

export async function addCanvasBlockAction(block: { type: string; content: string; order: number; position?: { x: number; y: number } }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  // Get canvas session
  const { data: sessions } = await supabase
    .from("canvas_sessions")
    .select("id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
  const canvasId = sessions[0].id;

  const sanitizedType = sanitizeBlockType(block.type);

  const { data, error } = await supabase
    .from("canvas_blocks")
    .insert([{
      canvas_id: canvasId,
      user_id: supabaseUserId,
      type: sanitizedType,
      content: block.content,
      order_index: block.order,
      position_x: block.position?.x || 0,
      position_y: block.position?.y || 0,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding canvas block:', error, 'Sanitized type:', sanitizedType);
    throw new Error('Failed to add block');
  }
  return {
    ...data,
    position: { x: data.position_x, y: data.position_y }
  };
}

export async function updateCanvasBlockAction(id: string, updates: { content?: string; type?: string; position?: { x: number; y: number } }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const dbUpdates: any = { ...updates };
  if (updates.type) {
    dbUpdates.type = sanitizeBlockType(updates.type);
  }
  if (updates.position) {
    dbUpdates.position_x = updates.position.x;
    dbUpdates.position_y = updates.position.y;
    delete dbUpdates.position;
  }

  const { error } = await supabase
    .from("canvas_blocks")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", supabaseUserId); // Ensure ownership

  if (error) {
    console.error('Error updating canvas block:', error);
    throw new Error('Failed to update block');
  }
}

export async function addEdgeAction(edge: { source: string; target: string; label?: string }) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  // Get canvas/verify block ownership ideally, but finding canvas_id from one block is safer
  // We can assume source block belongs to user, find its canvas_id.
  const { data: sourceBlock, error: blockError } = await supabase
    .from('canvas_blocks')
    .select('canvas_id')
    .eq('id', edge.source)
    .eq('user_id', supabaseUserId)
    .single();

  if (blockError || !sourceBlock) {
    throw new Error('Source block not found or access denied');
  }

  const { data, error } = await supabase
    .from('canvas_edges')
    .insert({
      canvas_id: sourceBlock.canvas_id,
      user_id: supabaseUserId,
      source_block_id: edge.source,
      target_block_id: edge.target,
      label: edge.label,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding edge:', error);
    throw new Error('Failed to add edge');
  }

  return {
    id: data.id,
    source: data.source_block_id,
    target: data.target_block_id,
    label: data.label,
  };
}

export async function deleteEdgeAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from('canvas_edges')
    .delete()
    .eq('id', id)
    .eq('user_id', supabaseUserId);

  if (error) {
    console.error('Error deleting edge:', error);
    throw new Error('Failed to delete edge');
  }
}

export async function deleteCanvasBlockAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("canvas_blocks")
    .delete()
    .eq("id", id)
    .eq("user_id", supabaseUserId);

  if (error) {
    console.error('Error deleting canvas block:', error);
    throw new Error('Failed to delete block');
  }
}

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[]) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  // First pass: Set to temporary negative values to avoid unique constraint violations
  for (const block of blocks) {
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ order_index: -1 * (block.order + 1) })
      .eq("id", block.id)
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error(`Error reordering (temp phase) canvas block ${block.id}:`, error);
      throw new Error(`Failed to update order for block ${block.id}`);
    }
  }

  // Second pass: Set to final values
  for (const block of blocks) {
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ order_index: block.order })
      .eq("id", block.id)
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error(`Error reordering (final phase) canvas block ${block.id}:`, error);
      throw new Error(`Failed to update order for block ${block.id}`);
    }
  }
}

export async function getUserIdeasAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user ideas:', error);
    throw new Error('Failed to fetch ideas');
  }

  return data;
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

  // Get canvas session
  const { data: sessions } = await supabase
    .from("canvas_sessions")
    .select("id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
  const canvasId = sessions[0].id;

  const { error } = await supabase
    .from("canvas_blocks")
    .delete()
    .eq("canvas_id", canvasId)
    .eq("user_id", supabaseUserId);

  if (error) {
    console.error('Error clearing canvas:', error);
    throw new Error('Failed to clear canvas');
  }
}

export async function saveToIdeasAction(content: string, title?: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .insert([{
      user_id: supabaseUserId,
      input_data: content,
      input_type: 'text',
      kernels: [title || 'Saved from Canvas'],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving to ideas:', error);
    throw new Error('Failed to save to ideas');
  }

  return data;
}

export async function deleteIdeaAction(id: string) {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from('idea_kernels')
    .delete()
    .eq('id', id)
    .eq('user_id', supabaseUserId);

  if (error) {
    console.error('Error deleting idea:', error);
    throw new Error('Failed to delete idea');
  }
}

export async function deleteAllChatsAction() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();


  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from('idea_kernels')
    .delete()
    .eq('user_id', supabaseUserId);

  if (error) {
    console.error('Error clearing all chats:', error);
    throw new Error('Failed to clear all chats');
  }
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