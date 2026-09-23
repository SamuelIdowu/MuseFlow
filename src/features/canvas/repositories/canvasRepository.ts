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
  async getCanvasData(
    supabase: SupabaseClient<Database>, 
    userId: string, 
    canvasId?: string, 
    forceNewSession?: boolean, 
    newSessionTitle?: string
  ) {
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

    if (!canvasSession && forceNewSession) {
      const { data: newSession, error: createError } = await supabase
        .from("canvas_sessions")
        .insert([{
          user_id: userId,
          name: newSessionTitle || "New Canvas",
        }])
        .select()
        .single();

      if (createError || !newSession) {
        console.error("Error creating new canvas session:", createError);
        throw new Error('Failed to create canvas session');
      }
      canvasSession = newSession;
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
            name: newSessionTitle || "New Canvas",
          }])
          .select()
          .single();

        if (createError || !newSession) {
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
      console.warn("Warning fetching canvas edges (falling back to empty edges):", edgesError);
    }

    const { data: chatMessagesData, error: chatError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("canvas_id", canvasSession.id)
      .order("created_at", { ascending: true });

    if (chatError) {
      if (chatError.code !== 'PGRST205' && chatError.code !== '42P01') {
        console.error("Error fetching chat messages:", chatError);
      }
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
      name: canvasSession.name || "Untitled Canvas",
      blocks: blocksData.map((block) => ({
        id: block.id,
        type: block.type || "paragraph",
        content: block.content,
        order: block.order_index,
        position: { x: block.position_x || 0, y: block.position_y || 0 },
      })),
      edges: (edgesData || []).map((edge) => ({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        label: edge.label,
      })),
      chatHistory
    };
  },

  async addChatMessage(supabase: SupabaseClient<Database>, userId: string, message: any, canvasId?: string) {
    try {
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
        console.warn('Could not persist chat message (non-fatal):', error.message || error);
      }
    } catch (err) {
      console.warn('Non-fatal error in addChatMessage:', err);
    }
  },

  async getGlobalChatMessages(supabase: SupabaseClient<Database>, userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .is("canvas_id", null)
        .order("created_at", { ascending: true });

      if (error) {
        return [];
      }

      return (data || []).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
        toolInvocations: msg.tool_invocations || undefined,
      }));
    } catch {
      return [];
    }
  },

  async updateCanvasChatHistory(supabase: SupabaseClient<Database>, userId: string, chatHistory: any[], canvasId?: string) {
    try {
      let targetCanvasId = canvasId;

      if (!targetCanvasId) {
        const { data: sessions } = await supabase
          .from("canvas_sessions")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (sessions && sessions.length > 0) {
          targetCanvasId = sessions[0].id;
        }
      }

      if (targetCanvasId && chatHistory.length > 0) {
        const rows = chatHistory.map(message => ({
          id: message.id || crypto.randomUUID(),
          user_id: userId,
          canvas_id: targetCanvasId,
          role: message.role,
          content: message.content || '',
          tool_invocations: message.toolInvocations || null,
          created_at: message.createdAt || new Date().toISOString()
        }));

        const { error } = await supabase
          .from("chat_messages")
          .upsert(rows, { onConflict: "id" });

        if (error) {
          console.warn("Could not upsert chat history (non-fatal):", error.message || error);
        }
      }
    } catch (err) {
      console.warn('Non-fatal error in updateCanvasChatHistory:', err);
    }
  },

  async addCanvasBlock(supabase: SupabaseClient<Database>, userId: string, block: { type: string; content: string; order: number; position?: { x: number; y: number } }, targetCanvasId?: string) {
    let canvasId = targetCanvasId;
    if (!canvasId) {
      const { data: sessions } = await supabase
        .from("canvas_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        canvasId = sessions[0].id;
      } else {
        const { data: newSession, error: createError } = await supabase
          .from("canvas_sessions")
          .insert([{ user_id: userId, name: "My Visual Canvas" }])
          .select()
          .single();
        if (createError || !newSession) {
          console.error("Error creating initial canvas session:", createError);
          throw new Error('Failed to create canvas session');
        }
        canvasId = newSession.id;
      }
    }

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
      throw new Error(`Failed to add block: ${error.message || 'Database insert error'}`);
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

  async reorderCanvasBlocks(supabase: SupabaseClient<Database>, userId: string, blocks: { id: string; order: number }[], canvasId?: string) {
    if (!blocks || blocks.length === 0) return;

    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const { data: firstBlock } = await supabase
        .from('canvas_blocks')
        .select('canvas_id')
        .eq('id', blocks[0].id)
        .eq('user_id', userId)
        .single();
      targetCanvasId = firstBlock?.canvas_id;
    }

    if (targetCanvasId) {
      const { error: rpcError } = await (supabase.rpc as any)('reorder_canvas_blocks', {
        p_canvas_id: targetCanvasId,
        p_user_id: userId,
        p_blocks: blocks,
      });

      if (!rpcError) {
        return;
      }
      console.warn('reorder_canvas_blocks RPC failed, falling back to batch update:', rpcError.message);
    }

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

  async clearCanvas(supabase: SupabaseClient<Database>, userId: string, targetCanvasId?: string) {
    let canvasId = targetCanvasId;
    if (!canvasId) {
      const { data: sessions } = await supabase
        .from("canvas_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
      canvasId = sessions[0].id;
    }

    // Delete edges first
    await supabase
      .from("canvas_edges")
      .delete()
      .eq("canvas_id", canvasId)
      .eq("user_id", userId);

    // Delete blocks
    const { error } = await supabase
      .from("canvas_blocks")
      .delete()
      .eq("canvas_id", canvasId)
      .eq("user_id", userId);

    if (error) {
      console.error('Error clearing canvas:', error);
      throw new Error('Failed to clear canvas');
    }
  },

  async createCanvasSession(supabase: SupabaseClient<Database>, userId: string, name: string = 'Untitled Canvas') {
    const { data: newSession, error } = await supabase
      .from("canvas_sessions")
      .insert([{
        user_id: userId,
        name: name,
      }])
      .select()
      .single();

    if (error || !newSession) {
      console.error("Error creating canvas session:", error);
      throw new Error('Failed to create canvas session');
    }
    return newSession;
  },

  async getUserCanvasSessions(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from("canvas_sessions")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching canvas sessions:", error);
      return [];
    }
    return data || [];
  },

  async updateCanvasSessionName(supabase: SupabaseClient<Database>, userId: string, id: string, name: string) {
    const { data, error } = await supabase
      .from("canvas_sessions")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating canvas session name:", error);
    }
    return data;
  },

  async deleteCanvasSession(supabase: SupabaseClient<Database>, userId: string, id: string) {
    // Delete edges, blocks, and session
    await supabase.from("canvas_edges").delete().eq("user_id", userId).eq("canvas_id", id);
    await supabase.from("canvas_blocks").delete().eq("user_id", userId).eq("canvas_id", id);
    const { error } = await supabase.from("canvas_sessions").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      console.error("Error deleting canvas session:", error);
      throw error;
    }
    return true;
  },

  async instantiateCanvasTemplate(
    supabase: SupabaseClient<Database>,
    userId: string,
    template: {
      title: string;
      blocks: Array<{ tempId: string; type: string; content: string; x: number; y: number }>;
      edges: Array<{ source: string; target: string; label?: string }>;
    }
  ) {
    // 1. Create canvas session
    const { data: session, error: sessionErr } = await supabase
      .from("canvas_sessions")
      .insert([{ user_id: userId, name: template.title }])
      .select()
      .single();

    if (sessionErr || !session) {
      console.error("Error creating canvas session for template:", sessionErr);
      throw new Error(`Failed to create canvas session: ${sessionErr?.message || "Unknown error"}`);
    }

    // 2. Batch insert all blocks in a single query
    const blocksToInsert = template.blocks.map((blk, idx) => ({
      canvas_id: session.id,
      user_id: userId,
      type: sanitizeBlockType(blk.type),
      content: blk.content,
      order_index: idx,
      position_x: blk.x,
      position_y: blk.y,
    }));

    const { data: insertedBlocks, error: blocksErr } = await supabase
      .from("canvas_blocks")
      .insert(blocksToInsert)
      .select();

    if (blocksErr || !insertedBlocks) {
      console.error("Error batch inserting template blocks:", blocksErr);
      await supabase.from("canvas_sessions").delete().eq("id", session.id).eq("user_id", userId);
      throw new Error(`Failed to populate template blocks: ${blocksErr?.message || "Unknown error"}`);
    }

    // 3. Map temporary IDs to real database UUIDs
    const idMap = new Map<string, string>();
    template.blocks.forEach((blk, idx) => {
      if (insertedBlocks[idx]) {
        idMap.set(blk.tempId, insertedBlocks[idx].id);
      }
    });

    // 4. Batch insert all edges in a single query
    if (template.edges && template.edges.length > 0) {
      const edgesToInsert = template.edges
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((e) => ({
          canvas_id: session.id,
          user_id: userId,
          source_block_id: idMap.get(e.source)!,
          target_block_id: idMap.get(e.target)!,
          label: e.label || null,
        }));

      if (edgesToInsert.length > 0) {
        const { error: edgesErr } = await supabase
          .from("canvas_edges")
          .insert(edgesToInsert);

        if (edgesErr) {
          console.warn("Non-fatal error creating template edges:", edgesErr);
        }
      }
    }

    return session;
  }
};
