import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureSupabaseUser, createSupabaseServiceClient } from '@/lib/supabaseServerClient';
import {
  getScheduledPostByIdFromDb,
  updateScheduledPostInDb,
  deleteScheduledPostFromDb,
} from '@/db/queries/schedule';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    if (process.env.DATABASE_URL) {
      try {
        const post = await getScheduledPostByIdFromDb(supabaseUserId, id);
        if (post) return NextResponse.json(post);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      } catch (neonErr) {
        console.warn('[GET /api/schedule/[id]] Neon error, falling back to Supabase:', neonErr);
      }
    }

    const supabase = createSupabaseServiceClient();

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', supabaseUserId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching scheduled post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const { content_blocks, channel, scheduled_time, optimize_time, status } = await request.json();

    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const content = Array.isArray(content_blocks)
        ? content_blocks.map((block: { content: string }) => block.content).join(' ')
        : content_blocks;
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`);

      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    if (process.env.DATABASE_URL) {
      try {
        const updated = await updateScheduledPostInDb(supabaseUserId, id, {
          contentBlocks: content_blocks,
          channel,
          scheduledTime: finalScheduledTime,
          status,
        });
        if (updated) return NextResponse.json(updated);
      } catch (neonErr) {
        console.warn('[PUT /api/schedule/[id]] Neon error, falling back to Supabase:', neonErr);
      }
    }

    const supabase = createSupabaseServiceClient();

    const updates: Record<string, any> = {
      content_blocks,
      channel,
      scheduled_time: finalScheduledTime,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', supabaseUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduled post:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const supabaseUserId = await ensureSupabaseUser(clerkUser.id, email);

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    if (process.env.DATABASE_URL) {
      try {
        await deleteScheduledPostFromDb(supabaseUserId, id);
        return NextResponse.json({ message: 'Scheduled post deleted successfully' });
      } catch (neonErr) {
        console.warn('[DELETE /api/schedule/[id]] Neon error, falling back to Supabase:', neonErr);
      }
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', supabaseUserId);

    if (error) {
      console.error('Error deleting scheduled post:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Scheduled post deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
