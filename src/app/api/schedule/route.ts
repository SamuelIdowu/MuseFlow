import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureSupabaseUser, createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Supabase user ID from Clerk ID
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      console.error('Schedule POST - Failed to ensure Supabase user for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const { content_blocks, channel, scheduled_time, optimize_time, active_profile } = await request.json();

    // Validate input
    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    // If optimize_time is requested, get AI suggestion for best posting time
    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const content = Array.isArray(content_blocks)
        ? content_blocks.map((block: { content: string }) => block.content).join(' ')
        : content_blocks;
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`, active_profile);

      // Combine the scheduled date with the suggested time
      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();

    // Save the scheduled post to the database
    const { data: scheduledPost, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert([{
        user_id: supabaseUserId,
        content_blocks,
        channel,
        scheduled_time: finalScheduledTime
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating scheduled post:', insertError);
      throw insertError;
    }

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
