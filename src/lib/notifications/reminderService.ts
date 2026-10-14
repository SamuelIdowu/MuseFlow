import { db } from '@/db';
import { scheduledPosts } from '@/db/schema/schedule';
import { eq, and, lte } from 'drizzle-orm';

export interface ProcessRemindersResult {
  processed: number;
  postIds: string[];
  errors: string[];
}

/**
 * Process due scheduled posts (Neon Postgres via Drizzle).
 * Fetches all posts whose scheduled_time is in the past and status is 'scheduled'.
 * Transitions their status to 'ready' to prevent double-firing.
 */
export async function processDueScheduledPosts(): Promise<ProcessRemindersResult> {
  const now = new Date();

  try {
    const duePosts = await db.query.scheduledPosts.findMany({
      where: and(
        eq(scheduledPosts.status, 'scheduled'),
        lte(scheduledPosts.scheduledTime, now)
      ),
      limit: 50,
    });

    if (!duePosts || duePosts.length === 0) {
      return { processed: 0, postIds: [], errors: [] };
    }

    const processedIds: string[] = [];
    const errors: string[] = [];

    for (const post of duePosts) {
      try {
        await db
          .update(scheduledPosts)
          .set({
            status: 'ready',
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        processedIds.push(post.id);
      } catch (err: unknown) {
        errors.push(`Error processing post ${post.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      processed: processedIds.length,
      postIds: processedIds,
      errors,
    };
  } catch (fetchError: any) {
    console.error('Failed to fetch due scheduled posts:', fetchError);
    throw fetchError;
  }
}
