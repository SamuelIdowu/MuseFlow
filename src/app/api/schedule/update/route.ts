/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureDbUser } from '@/db/queries/users';
import { updateScheduledPostInDb } from '@/db/queries/schedule';

export async function PUT(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
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

    const updated = await updateScheduledPostInDb(userId, postId, {
      contentBlocks: content_blocks,
      channel,
      scheduledTime: finalScheduledTime,
      status: status || 'scheduled',
    });

    if (!updated) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: 500 }
    );
  }
}