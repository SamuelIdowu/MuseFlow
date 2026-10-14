import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { suggestBestTime } from '@/lib/geminiClient';
import { ensureDbUser } from '@/db/queries/users';
import { checkFeatureAccess } from '@/lib/plans/featureGates';
import { getScheduledPostsFromDb, createScheduledPostInDb } from '@/db/queries/schedule';

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const posts = await getScheduledPostsFromDb(userId);
    return NextResponse.json(posts);
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
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
      console.error('Schedule POST - Failed to ensure user in database for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const gateCheck = await checkFeatureAccess(userId, 'scheduled_posts');
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

    const post = await createScheduledPostInDb(userId, {
      contentBlocks: content_blocks,
      channel,
      scheduledTime: finalScheduledTime,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
