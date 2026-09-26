import { db } from "../index";
import { usageTracking, subscriptions } from "../schema/billing";
import { users } from "../schema/users";
import { eq, and, sql, inArray } from "drizzle-orm";

export async function getUsageFromDb(userId: string, metric: string, periodStart: Date): Promise<number> {
  const record = await db.query.usageTracking.findFirst({
    where: and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.metric, metric),
      eq(usageTracking.periodStart, periodStart)
    ),
  });

  return record?.count ?? 0;
}

export async function incrementUsageInDb(
  userId: string,
  metric: string,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  await db
    .insert(usageTracking)
    .values({
      userId,
      metric,
      count: 1,
      periodStart,
      periodEnd,
    })
    .onConflictDoUpdate({
      target: [usageTracking.userId, usageTracking.metric, usageTracking.periodStart],
      set: {
        count: sql`${usageTracking.count} + 1`,
      },
    });
}

export async function getUserSubscriptionPlanFromDb(userId: string): Promise<"free" | "pro" | "business"> {
  const activeSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      inArray(subscriptions.status, ["active", "trialing"])
    ),
  });

  if (activeSub) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (user?.subscriptionPlan) {
      return user.subscriptionPlan as "free" | "pro" | "business";
    }
  }

  return "free";
}
