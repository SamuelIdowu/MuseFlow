import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
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
        .eq('user_id', session.user.id),
      supabase
        .from('canvas_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id),
      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
    ]);

    const userData = {
      id: session.user.id,
      email: session.user.email,
      stats: {
        ideasGenerated: ideaCount || 0,
        canvasCreated: canvasCount || 0,
        scheduledPosts: scheduleCount || 0
      },
      createdAt: session.user.created_at
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}