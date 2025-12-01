import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  const supabase = await createSupabaseServiceClient();
  
  try {
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user stats from the database
    const [
      { count: ideaCount },
      { count: canvasCount },
      { count: scheduleCount }
    ] = await Promise.all([
      supabase
        .from('idea_kernels')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('canvas_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ]);

    const userData = {
      id: user.id,
      email: user.email,
      stats: {
        ideasGenerated: ideaCount || 0,
        canvasCreated: canvasCount || 0,
        scheduledPosts: scheduleCount || 0
      },
      createdAt: user.created_at
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}