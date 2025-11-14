/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Profile Service
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async createProfile(userId: string, profileData: {
    niche?: string;
    tone_config?: any;
    samples?: string[];
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        user_id: userId, 
        ...profileData 
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profileData: {
    niche?: string;
    tone_config?: any;
    samples?: string[];
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        ...profileData,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Ideas Service
export const ideasService = {
  async createIdeaKernel(userId: string, input_text: string, input_type: string, kernels: string[]) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .insert([{
        user_id: userId,
        input_type,
        input_data: input_text,
        kernels
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserIdeas(userId: string) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  
  async getIdeaById(userId: string, ideaId: string) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Canvas Service
export const canvasService = {
  async createCanvasSession(userId: string, name: string) {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .insert([{
        user_id: userId,
        name
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCanvasSession(canvasId: string, userId: string) {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .select(`
        *,
        canvas_blocks(*)
      `)
      .eq('id', canvasId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async saveCanvasBlocks(canvasId: string, userId: string, blocks: Array<{
    type: string;
    content: string;
    order_index: number;
    meta?: any;
  }>) {
    // First, delete existing blocks for this canvas
    await supabase
      .from('canvas_blocks')
      .delete()
      .eq('canvas_id', canvasId);

    // Then insert new blocks
    const blocksWithCanvasId = blocks.map((block, index) => ({
      canvas_id: canvasId,
      user_id: userId,
      type: block.type,
      content: block.content,
      order_index: block.order_index ?? index,
      meta: block.meta || {}
    }));

    const { data, error } = await supabase
      .from('canvas_blocks')
      .insert(blocksWithCanvasId)
      .select();

    if (error) throw error;
    return data;
  }
};

// Schedule Service
export const scheduleService = {
  async createScheduledPost(userId: string, content_blocks: any[], channel: string, scheduled_time: string) {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert([{
        user_id: userId,
        content_blocks,
        channel,
        scheduled_time
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserScheduledPosts(userId: string) {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  async deleteScheduledPost(postId: string, userId: string) {
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};