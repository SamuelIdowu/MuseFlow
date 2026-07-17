'use server';

import { createClerkSupabaseClient } from './supabaseServerClient';
import { getAuthenticatedSupabaseUserId } from './authUtils';
import { Profile } from '@/types/profile';

export async function getDashboardStats() {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();

  let ideasCount = 0;
  let contentCount = 0;
  let scheduledCount = 0;
  let profileCount = 0;

  try {
    const { count: ideasCountResult, error: ideasError } = await supabase
      .from('idea_kernels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (ideasError) throw new Error('Could not fetch ideas count');
    ideasCount = ideasCountResult || 0;

    const { count: contentCountResult, error: contentError } = await supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (contentError) throw new Error('Could not fetch content count');
    contentCount = contentCountResult || 0;

    const { count: scheduledCountResult, error: scheduledError } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (scheduledError) throw new Error('Could not fetch scheduled posts count');
    scheduledCount = scheduledCountResult || 0;

    const { count: profileCountResult, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (profileError) throw new Error('Could not fetch profile count');
    profileCount = profileCountResult || 0;
  } catch (error) {
    console.error('[getDashboardStats] Database error:', error);
    throw new Error('Could not fetch dashboard statistics');
  }

  return {
    ideasCount,
    contentCount,
    scheduledCount,
    profileCount,
  };
}

export async function getActiveProfile(): Promise<Profile | null> {
  const supabaseUserId = await getAuthenticatedSupabaseUserId();
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUserId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active profile (FULL ERROR STRINGIFIED):', JSON.stringify(error, null, 2));
    console.error('Error fetching active profile (FULL ERROR DIR):', error);
    throw new Error('Failed to fetch active profile');
  }

  return data as Profile;
}