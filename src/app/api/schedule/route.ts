import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { scheduleService } from '@/lib/supabaseService';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_blocks, channel, scheduled_time, optimize_time } = await request.json();

    // Validate input
    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    // If optimize_time is requested, get AI suggestion for best posting time
    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const content = content_blocks.map((block: any) => block.content).join(' ');
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`);
      
      // Combine the scheduled date with the suggested time
      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    // Save the scheduled post to the database
    const scheduledPost = await scheduleService.createScheduledPost(
      session.user.id,
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