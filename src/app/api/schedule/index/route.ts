import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { scheduleService } from '@/lib/supabaseService';
import { getSupabaseUserId } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule GET - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user ID from Clerk ID
    const supabaseUserId = await getSupabaseUserId(clerkUser.id);

    if (!supabaseUserId) {
      console.error('Schedule GET - No Supabase user ID found for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    // Fetch scheduled posts from the database
    const scheduledPosts = await scheduleService.getUserScheduledPosts(supabaseUserId);

    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
