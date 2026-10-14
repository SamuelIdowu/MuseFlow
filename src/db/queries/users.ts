import { db } from "../index";
import { users, type User } from "../schema/users";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Fast lookup of internal user UUID by Clerk User ID (Neon Postgres via Drizzle).
 */
export const getDbUserId = cache(async (clerkUserId: string): Promise<string | null> => {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
      columns: { id: true },
    });
    return result?.id || null;
  } catch (err) {
    console.error("[getDbUserId] Neon query failed:", err);
    return null;
  }
});

/**
 * Ensure user exists in database with Clerk ID and email.
 * Upserts user record in Neon.
 */
export const ensureDbUser = cache(async (clerkUserId: string, email?: string): Promise<string | null> => {
  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (existing) return existing.id;

    if (email) {
      const [created] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email },
        })
        .returning({ id: users.id });

      if (created?.id) return created.id;
    }

    return null;
  } catch (err) {
    console.error("[ensureDbUser] Neon upsert failed:", err);
    return null;
  }
});
