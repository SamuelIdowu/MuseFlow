import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureSupabaseUser, createSupabaseServiceClient } from '@/lib/supabaseServerClient';
import { checkFeatureAccess } from '@/lib/plans/featureGates';

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const supabase = createSupabaseServiceClient();

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

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      console.error('Schedule POST - Failed to ensure Supabase user for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const gateCheck = await checkFeatureAccess(supabaseUserId, 'scheduled_posts');
    if (!gateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'PLAN_UPGRADE_REQUIRED',
          message: gateCheck.reason || 'Post scheduling requires a Freelancer Pro plan.',
          feature: 'scheduled_posts',
          requiredPlan: gateCheck.requiredPlan,
        },
        { status: 403 }
      );
    }

    const { content_blocks, channel, scheduled_time, optimize_time, active_profile } = await request.json();

    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const content = Array.isArray(content_blocks)
        ? content_blocks.map((block: { content: string }) => block.content).join(' ')
        : content_blocks;
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`, active_profile);

      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    const supabase = createSupabaseServiceClient();

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
