import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../lib/database.types';

type IdeaKernel = Database['public']['Tables']['idea_kernels']['Row'];

export const ideaRepository = {
  async getRecentIdeas(supabase: SupabaseClient<Database>, userId: string, limit: number = 3) {
    const { data: ideasData, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !ideasData) {
      console.error('Error fetching recent ideas:', error);
      throw new Error('Could not fetch recent ideas');
    }

    const recentIdeas = (ideasData as IdeaKernel[]).flatMap(idea =>
      (idea.kernels as string[]).map((kernel: string, index: number) => ({
        id: `${idea.id}-${index}`,
        title: kernel,
        createdAt: idea.created_at,
        inputData: idea.input_data,
        inputType: idea.input_type,
      }))
    ).slice(0, limit);

    return recentIdeas;
  },

  async getRecentChats(supabase: SupabaseClient<Database>, userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .select('id, input_data, created_at')
      .eq('user_id', userId)
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
  },

  async getChatById(supabase: SupabaseClient<Database>, userId: string, id: string) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    let messages: any[] = [];
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
          messages.push({
            id: `msg-ai-${index}`,
            role: 'assistant',
            content: k,
            type: 'text',
            timestamp: new Date(data.created_at)
          });
        } else if (k.role && k.content) {
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
  },

  async getUserIdeas(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ideas:', error);
      throw new Error('Failed to fetch ideas');
    }

    return data;
  },

  async saveToIdeas(supabase: SupabaseClient<Database>, userId: string, content: string, title?: string) {
    const { data, error } = await supabase
      .from('idea_kernels')
      .insert([{
        user_id: userId,
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
  },

  async deleteIdea(supabase: SupabaseClient<Database>, userId: string, id: string) {
    const { error } = await supabase
      .from('idea_kernels')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting idea:', error);
      throw new Error('Failed to delete idea');
    }
  },

  async deleteAllChats(supabase: SupabaseClient<Database>, userId: string) {
    const { error } = await supabase
      .from('idea_kernels')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing all chats:', error);
      throw new Error('Failed to clear all chats');
    }
  }
};
