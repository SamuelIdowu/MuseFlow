'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export async function getDashboardStats() {
  // Create Supabase client with SSR support
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key for client-side auth
  );

  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    console.error('Dashboard stats - No user found or user error:', { error });
    throw new Error('User not authenticated');
  }

  const userId = user.id;

  let ideasCount = 0;
  let contentCount = 0;
  let scheduledCount = 0;
  let profileCount = 0;

  try {
    // Get idea count
    const { count: ideasCountResult, error: ideasError } = await supabase
      .from('idea_kernels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (ideasError) {
      console.error('Error fetching ideas count:', ideasError);
      throw new Error('Could not fetch ideas count');
    }
    ideasCount = ideasCountResult || 0;

    // Get canvas sessions count (as content pieces)
    const { count: contentCountResult, error: contentError } = await supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (contentError) {
      console.error('Error fetching content count:', contentError);
      throw new Error('Could not fetch content count');
    }
    contentCount = contentCountResult || 0;

    // Get scheduled posts count
    const { count: scheduledCountResult, error: scheduledError } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (scheduledError) {
      console.error('Error fetching scheduled posts count:', scheduledError);
      throw new Error('Could not fetch scheduled posts count');
    }
    scheduledCount = scheduledCountResult || 0;

    // Get profile count (should be 1 per user, but counting for consistency)
    const { count: profileCountResult, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error fetching profile count:', profileError);
      throw new Error('Could not fetch profile count');
    }
    profileCount = profileCountResult || 0;
  } catch (error) {
    console.error('Database error in getDashboardStats:', error);
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
  // Create Supabase client with SSR support
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key for client-side auth
  );

  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    console.error('Recent ideas - No user found or user error:', { error });
    throw new Error('User not authenticated');
  }

  const userId = user.id;

  let ideas = [];

  try {
    // Get recent idea kernels
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

    ideas = ideasData;
  } catch (error) {
    console.error('Database error in getRecentIdeas:', error);
    throw new Error('Could not fetch recent ideas');
  }

  // Transform the data to have a flat list of ideas with their metadata
  type IdeaKernel = Database['public']['Tables']['idea_kernels']['Row'];
  const recentIdeas = (ideas as IdeaKernel[]).flatMap(idea =>
    (idea.kernels as string[]).map((kernel: string) => ({
      id: idea.id,
      title: kernel,
      createdAt: idea.created_at,
      inputData: idea.input_data,
      inputType: idea.input_type,
    }))
  ).slice(0, limit); // Limit again after flattening

  return recentIdeas;
}