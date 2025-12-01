import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { currentUser } from '@clerk/nextjs/server';
import { getSupabaseUserId, createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Ideas Schedule POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user ID from Clerk ID
    const supabaseUserId = await getSupabaseUserId(clerkUser.id);

    if (!supabaseUserId) {
      console.error('Ideas Schedule POST - No Supabase user ID found for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    const { title, content, channel, scheduled_time, optimize_time = false, idea_id, active_profile } = await request.json();

    // Validate input
    if (!title?.trim() || !content?.trim() || !channel) {
      return NextResponse.json({ error: 'Title, content and channel are required' }, { status: 400 });
    }

    // If optimize_time is requested, get AI suggestion for best posting time
    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`, active_profile);

      // Combine the scheduled date with the suggested time
      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();

    // If an idea_id is provided, fetch the idea from the database to get the kernels array
    let contentBlocks;
    if (idea_id) {
      try {
        const { data: idea, error } = await supabase
          .from('idea_kernels')
          .select('*')
          .eq('id', idea_id)
          .eq('user_id', supabaseUserId)
          .single();

        if (!error && idea && idea.kernels && Array.isArray(idea.kernels)) {
          // Use the idea kernels to create content blocks
          contentBlocks = idea.kernels
            .filter((kernel: any): kernel is string => typeof kernel === 'string')
            .map((kernel: string, index: number) => ({
              type: 'paragraph',
              content: kernel,
              order_index: index
            }));
        } else {
          // Fallback to single block if idea not found
          contentBlocks = [{
            type: 'paragraph',
            content: content,
            order_index: 0
          }];
        }
      } catch {
        // If there's an error fetching the idea, use the provided content
        contentBlocks = [{
          type: 'paragraph',
          content: content,
          order_index: 0
        }];
      }
    } else {
      // Create content blocks from the provided content
      contentBlocks = [{
        type: 'paragraph',
        content: content,
        order_index: 0
      }];
    }

    // Save the scheduled post to the database
    const { data: scheduledPost, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert([{
        user_id: supabaseUserId,
        content_blocks: contentBlocks,
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
    console.error('Error scheduling post from idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
