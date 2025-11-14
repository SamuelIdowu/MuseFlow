import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

async function getDashboardStatsAPI() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Get idea count
  const { count: ideasCount, error: ideasError } = await supabase
    .from('idea_kernels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (ideasError) {
    console.error('Error fetching ideas count:', ideasError);
    throw new Error('Could not fetch ideas count');
  }

  // Get canvas sessions count (as content pieces)
  const { count: contentCount, error: contentError } = await supabase
    .from('canvas_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (contentError) {
    console.error('Error fetching content count:', contentError);
    throw new Error('Could not fetch content count');
  }

  // Get scheduled posts count
  const { count: scheduledCount, error: scheduledError } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (scheduledError) {
    console.error('Error fetching scheduled posts count:', scheduledError);
    throw new Error('Could not fetch scheduled posts count');
  }

  // Get profile count (should be 1 per user, but counting for consistency)
  const { count: profileCount, error: profileError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (profileError) {
    console.error('Error fetching profile count:', profileError);
    throw new Error('Could not fetch profile count');
  }

  return {
    ideasCount: ideasCount || 0,
    contentCount: contentCount || 0,
    scheduledCount: scheduledCount || 0,
    profileCount: profileCount || 0,
  };
}

export async function GET(request: Request) {
  try {
    // Get the session
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the stats function
    const stats = await getDashboardStatsAPI();
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}