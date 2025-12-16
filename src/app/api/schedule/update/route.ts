/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureSupabaseUser, createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function PUT(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Supabase user ID from Clerk ID
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    // Get post ID from query parameters
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { content_blocks, channel, scheduled_time, optimize_time, status } = await request.json();

    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    // If optimize_time is requested, get AI suggestion for best posting time
    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const content = Array.isArray(content_blocks)
        ? content_blocks.map((block: any) => block.content).join(' ')
        : content_blocks;
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`);

      // Combine the scheduled date with the suggested time
      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();

    // Update the scheduled post in the database
    // Ensure we also check user_id to prevent updating other users' posts
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        content_blocks,
        channel,
        scheduled_time: finalScheduledTime,
        status: status || 'scheduled'
      })
      .eq('id', postId)
      .eq('user_id', supabaseUserId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: 500 }
    );
  }
}