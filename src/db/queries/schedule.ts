import { db } from "../index";
import { scheduledPosts } from "../schema/schedule";
import { eq, and, asc, desc, gte } from "drizzle-orm";

export async function getScheduledPostsFromDb(userId: string) {
  const posts = await db.query.scheduledPosts.findMany({
    where: eq(scheduledPosts.userId, userId),
    orderBy: [asc(scheduledPosts.scheduledTime)],
  });

  return posts.map((p) => ({
    id: p.id,
    user_id: p.userId,
    content_blocks: p.contentBlocks,
    channel: p.channel,
    scheduled_time: p.scheduledTime.toISOString(),
    status: p.status,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }));
}

export async function getUpcomingPostsFromDb(userId: string, limit: number = 3) {
  const now = new Date();
  const posts = await db.query.scheduledPosts.findMany({
    where: and(eq(scheduledPosts.userId, userId), gte(scheduledPosts.scheduledTime, now)),
    orderBy: [asc(scheduledPosts.scheduledTime)],
    limit,
  });

  return posts.map((p) => ({
    id: p.id,
    user_id: p.userId,
    content_blocks: p.contentBlocks,
    channel: p.channel,
    scheduled_time: p.scheduledTime.toISOString(),
    status: p.status,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }));
}

export async function createScheduledPostInDb(
  userId: string,
  data: {
    contentBlocks: any;
    channel: string;
    scheduledTime: Date | string;
    status?: string;
  }
) {
  const [created] = await db
    .insert(scheduledPosts)
    .values({
      userId,
      contentBlocks: data.contentBlocks,
      channel: data.channel,
      scheduledTime: typeof data.scheduledTime === "string" ? new Date(data.scheduledTime) : data.scheduledTime,
      status: data.status || "scheduled",
    })
    .returning();

  return {
    id: created.id,
    user_id: created.userId,
    content_blocks: created.contentBlocks,
    channel: created.channel,
    scheduled_time: created.scheduledTime.toISOString(),
    status: created.status,
    created_at: created.createdAt.toISOString(),
    updated_at: created.updatedAt.toISOString(),
  };
}

export async function deleteScheduledPostFromDb(userId: string, id: string) {
  await db
    .delete(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)));
}

export async function getScheduledPostByIdFromDb(userId: string, id: string) {
  const post = await db.query.scheduledPosts.findFirst({
    where: and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)),
  });

  if (!post) return null;

  return {
    id: post.id,
    user_id: post.userId,
    content_blocks: post.contentBlocks,
    channel: post.channel,
    scheduled_time: post.scheduledTime.toISOString(),
    status: post.status,
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
  };
}

export async function updateScheduledPostInDb(
  userId: string,
  id: string,
  data: {
    contentBlocks?: any;
    channel?: string;
    scheduledTime?: Date | string;
    status?: string;
  }
) {
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.contentBlocks !== undefined) updates.contentBlocks = data.contentBlocks;
  if (data.channel !== undefined) updates.channel = data.channel;
  if (data.scheduledTime !== undefined) {
    updates.scheduledTime = typeof data.scheduledTime === "string" ? new Date(data.scheduledTime) : data.scheduledTime;
  }
  if (data.status !== undefined) updates.status = data.status;

  const [updated] = await db
    .update(scheduledPosts)
    .set(updates)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)))
    .returning();

  if (!updated) return null;

  return {
    id: updated.id,
    user_id: updated.userId,
    content_blocks: updated.contentBlocks,
    channel: updated.channel,
    scheduled_time: updated.scheduledTime.toISOString(),
    status: updated.status,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  };
}
