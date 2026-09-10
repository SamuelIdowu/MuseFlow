import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export interface ProcessRemindersResult {
  processed: number;
  postIds: string[];
  errors: string[];
}

/**
 * Process due scheduled posts.
 * Fetches all posts whose scheduled_time is in the past and status is 'scheduled'.
 * Transitions their status to 'ready' to prevent double-firing.
 */
export async function processDueScheduledPosts(): Promise<ProcessRemindersResult> {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: duePosts, error: fetchError } = await supabase
    .from('scheduled_posts')
    .select('id, user_id, channel, scheduled_time, content_blocks')
    .eq('status', 'scheduled')
    .lte('scheduled_time', now)
    .limit(50);

  if (fetchError) {
    console.error('Failed to fetch due scheduled posts:', fetchError);
    throw fetchError;
  }

  if (!duePosts || duePosts.length === 0) {
    return { processed: 0, postIds: [], errors: [] };
  }

  const processedIds: string[] = [];
  const errors: string[] = [];

  for (const post of duePosts) {
    try {
      // Transition status to ready
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) {
        errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
        continue;
      }

      processedIds.push(post.id);
    } catch (err: any) {
      errors.push(`Error processing post ${post.id}: ${err.message || err}`);
    }
  }

  return {
    processed: processedIds.length,
    postIds: processedIds,
    errors,
  };
}
