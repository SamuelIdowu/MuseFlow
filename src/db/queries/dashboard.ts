import { db } from "../index";
import { sql } from "drizzle-orm";

export async function getDashboardStatsFromDb(userId: string) {
  const result = await db.execute<{
    ideas_count: number;
    canvas_count: number;
    scheduled_count: number;
    profile_count: number;
    campaigns_count: number;
  }>(sql`
    SELECT
      (SELECT count(*)::int FROM idea_kernels WHERE user_id = ${userId}) AS ideas_count,
      (SELECT count(*)::int FROM canvas_sessions WHERE user_id = ${userId}) AS canvas_count,
      (SELECT count(*)::int FROM scheduled_posts WHERE user_id = ${userId}) AS scheduled_count,
      (SELECT count(*)::int FROM profiles WHERE user_id = ${userId}) AS profile_count,
      (SELECT count(*)::int FROM saved_campaigns WHERE user_id = ${userId}) AS campaigns_count
  `);

  const row = result.rows[0];
  const ideasCount = Number(row?.ideas_count || 0);
  const canvasCount = Number(row?.canvas_count || 0);
  const scheduledCount = Number(row?.scheduled_count || 0);
  const profileCount = Number(row?.profile_count || 0);
  const campaignsCount = Number(row?.campaigns_count || 0);

  return {
    ideasCount,
    contentCount: canvasCount,
    canvasCount,
    scheduledCount,
    profileCount,
    campaignsCount,
  };
}
