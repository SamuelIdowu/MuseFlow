import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureSupabaseUser, createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule GET - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Supabase user ID from Clerk ID
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      console.error('Schedule GET - Failed to ensure Supabase user for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();

    // Fetch scheduled posts from the database
    const { data: scheduledPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }

    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
