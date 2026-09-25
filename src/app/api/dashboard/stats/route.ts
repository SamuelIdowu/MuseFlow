import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

async function getDashboardStatsAPI(userId: string) {
  const supabase = createSupabaseServiceClient();

  // Run all count queries concurrently instead of sequentially
  const [
    ideasRes,
    contentRes,
    scheduledRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from('idea_kernels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (ideasRes.error) console.error('Error fetching ideas count:', ideasRes.error);
  if (contentRes.error) console.error('Error fetching content count:', contentRes.error);
  if (scheduledRes.error) console.error('Error fetching scheduled posts count:', scheduledRes.error);
  if (profileRes.error) console.error('Error fetching profile count:', profileRes.error);

  return {
    ideasCount: ideasRes.count || 0,
    contentCount: contentRes.count || 0,
    scheduledCount: scheduledRes.count || 0,
    profileCount: profileRes.count || 0,
  };
}

export async function GET(request: Request) {
  try {
    // 1. Check for load test user header (set by middleware when authorized)
    let userId: string | null = request.headers.get('x-load-test-user');

    // 2. Otherwise authenticate via Clerk session
    if (!userId) {
      const authData = await auth();
      userId = authData.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the optimized stats function
    const stats = await getDashboardStatsAPI(userId);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}