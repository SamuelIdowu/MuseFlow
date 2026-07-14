import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../lib/database.types';

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

export const canvasRepository = {
  async getCanvasData(supabase: SupabaseClient<Database>, userId: string, canvasId?: string) {
    let canvasSession;

    if (canvasId) {
      const { data, error } = await supabase
        .from("canvas_sessions")
        .select("*")
        .eq("id", canvasId)
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        canvasSession = data;
      }
    }

    if (!canvasSession) {
      const { data: existingSessions, error: sessionError } = await supabase
        .from("canvas_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error("Error fetching canvas sessions:", sessionError);
        throw new Error('Failed to fetch canvas sessions');
      }

      if (existingSessions && existingSessions.length > 0) {
        canvasSession = existingSessions[0];
      } else {
        const { data: newSession, error: createError } = await supabase
          .from("canvas_sessions")
          .insert([{
            user_id: userId,
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

    const { data: blocksData, error: blocksError } = await supabase
      .from("canvas_blocks")
      .select("*")
      .eq("canvas_id", canvasSession.id)
      .order("order_index", { ascending: true });

    if (blocksError) {
      console.error("Error fetching canvas blocks:", blocksError);
      throw new Error('Failed to fetch canvas blocks');
    }

    const { data: edgesData, error: edgesError } = await supabase
      .from("canvas_edges")
      .select("*")
      .eq("canvas_id", canvasSession.id);

    if (edgesError) {
      console.error("Error fetching canvas edges:", edgesError);
      throw new Error('Failed to fetch canvas edges');
    }

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
        position: { x: block.position_x || 0, y: block.position_y || 0 },
      })),
      edges: edgesData.map((edge) => ({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        label: edge.label,
      })),
      chatHistory
    };
  },

  async addChatMessage(supabase: SupabaseClient<Database>, userId: string, message: any, canvasId?: string) {
    const { error } = await supabase
      .from("chat_messages")
      .insert([{
        id: message.id,
        user_id: userId,
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
  },

  async getGlobalChatMessages(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
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
  },

  async updateCanvasChatHistory(supabase: SupabaseClient<Database>, userId: string, chatHistory: any[], canvasId?: string) {
    let targetCanvasId = canvasId;

    if (!targetCanvasId) {
      const { data: sessions } = await supabase
        .from("canvas_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
      targetCanvasId = sessions[0].id;
    }

    await supabase.from("chat_messages").delete().eq("canvas_id", targetCanvasId).eq("user_id", userId);
    
    if (chatHistory.length > 0) {
      const { error } = await supabase.from("chat_messages").insert(
        chatHistory.map(message => ({
          id: message.id || crypto.randomUUID(),
          user_id: userId,
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
  },

  async addCanvasBlock(supabase: SupabaseClient<Database>, userId: string, block: { type: string; content: string; order: number; position?: { x: number; y: number } }) {
    const { data: sessions } = await supabase
      .from("canvas_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
    const canvasId = sessions[0].id;

    const sanitizedType = sanitizeBlockType(block.type);

    const { data, error } = await supabase
      .from("canvas_blocks")
      .insert([{
        canvas_id: canvasId,
        user_id: userId,
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
  },

  async updateCanvasBlock(supabase: SupabaseClient<Database>, userId: string, id: string, updates: { content?: string; type?: string; position?: { x: number; y: number } }) {
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
      .eq("user_id", userId);

    if (error) {
      console.error('Error updating canvas block:', error);
      throw new Error('Failed to update block');
    }
  },

  async addEdge(supabase: SupabaseClient<Database>, userId: string, edge: { source: string; target: string; label?: string }) {
    const { data: sourceBlock, error: blockError } = await supabase
      .from('canvas_blocks')
      .select('canvas_id')
      .eq('id', edge.source)
      .eq('user_id', userId)
      .single();

    if (blockError || !sourceBlock) {
      throw new Error('Source block not found or access denied');
    }

    const { data, error } = await supabase
      .from('canvas_edges')
      .insert({
        canvas_id: sourceBlock.canvas_id,
        user_id: userId,
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
  },

  async deleteEdge(supabase: SupabaseClient<Database>, userId: string, id: string) {
    const { error } = await supabase
      .from('canvas_edges')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting edge:', error);
      throw new Error('Failed to delete edge');
    }
  },

  async deleteCanvasBlock(supabase: SupabaseClient<Database>, userId: string, id: string) {
    const { error } = await supabase
      .from("canvas_blocks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error('Error deleting canvas block:', error);
      throw new Error('Failed to delete block');
    }
  },

  async reorderCanvasBlocks(supabase: SupabaseClient<Database>, userId: string, blocks: { id: string; order: number }[]) {
    for (const block of blocks) {
      const { error } = await supabase
        .from("canvas_blocks")
        .update({ order_index: -1 * (block.order + 1) })
        .eq("id", block.id)
        .eq("user_id", userId);

      if (error) {
        console.error(`Error reordering (temp phase) canvas block ${block.id}:`, error);
        throw new Error(`Failed to update order for block ${block.id}`);
      }
    }

    for (const block of blocks) {
      const { error } = await supabase
        .from("canvas_blocks")
        .update({ order_index: block.order })
        .eq("id", block.id)
        .eq("user_id", userId);

      if (error) {
        console.error(`Error reordering (final phase) canvas block ${block.id}:`, error);
        throw new Error(`Failed to update order for block ${block.id}`);
      }
    }
  },

  async clearCanvas(supabase: SupabaseClient<Database>, userId: string) {
    const { data: sessions } = await supabase
      .from("canvas_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
    const canvasId = sessions[0].id;

    const { error } = await supabase
      .from("canvas_blocks")
      .delete()
      .eq("canvas_id", canvasId)
      .eq("user_id", userId);

    if (error) {
      console.error('Error clearing canvas:', error);
      throw new Error('Failed to clear canvas');
    }
  }
};
