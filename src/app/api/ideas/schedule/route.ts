/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { db } from '@/db';
import { ideaKernels } from '@/db/schema/ideas';
import { eq, and } from 'drizzle-orm';
import { createScheduledPostInDb } from '@/db/queries/schedule';

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Ideas Schedule POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
      console.error('Ideas Schedule POST - Failed to sync user for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    const { title, content, channel, scheduled_time, optimize_time = false, idea_id, active_profile } = await request.json();

    if (!title?.trim() || !content?.trim() || !channel) {
      return NextResponse.json({ error: 'Title, content and channel are required' }, { status: 400 });
    }

    let finalScheduledTime = scheduled_time;
    if (optimize_time) {
      const suggestedTime = await suggestBestTime(content, `Channel: ${channel}`, active_profile);

      const date = new Date(scheduled_time);
      const [hours, minutes] = suggestedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      finalScheduledTime = date.toISOString();
    }

    let contentBlocks;
    if (idea_id) {
      try {
        const idea = await db.query.ideaKernels.findFirst({
          where: and(eq(ideaKernels.id, idea_id), eq(ideaKernels.userId, userId)),
        });

        if (idea && idea.kernels && Array.isArray(idea.kernels)) {
          contentBlocks = idea.kernels
            .filter((kernel: any): kernel is string => typeof kernel === 'string')
            .map((kernel: string, index: number) => ({
              type: 'paragraph',
              content: kernel,
              order_index: index,
            }));
        } else {
          contentBlocks = [{
            type: 'paragraph',
            content: content,
            order_index: 0,
          }];
        }
      } catch {
        contentBlocks = [{
          type: 'paragraph',
          content: content,
          order_index: 0,
        }];
      }
    } else {
      contentBlocks = [{
        type: 'paragraph',
        content: content,
        order_index: 0,
      }];
    }

    const scheduledPost = await createScheduledPostInDb(userId, {
      contentBlocks,
      channel,
      scheduledTime: finalScheduledTime,
    });

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error('Error scheduling post from idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
