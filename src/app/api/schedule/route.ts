import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { scheduleService } from '@/lib/supabaseService';
import { getSupabaseUserId } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user ID from Clerk ID
    const supabaseUserId = await getSupabaseUserId(clerkUser.id);

    if (!supabaseUserId) {
      console.error('Schedule POST - No Supabase user ID found for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    const { content_blocks, channel, scheduled_time, optimize_time } = await request.json();

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
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`);

      // Combine the scheduled date with the suggested time
      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    // Save the scheduled post to the database
    const scheduledPost = await scheduleService.createScheduledPost(
      supabaseUserId,
      content_blocks,
      channel,
      finalScheduledTime
    );

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
