import { db } from "../index";
import { users, type User } from "../schema/users";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { ensureSupabaseUser } from "../../lib/supabaseServerClient";

/**
 * Fast lookup of internal user UUID by Clerk User ID.
 * Supports dual-database fallback: tries Neon (Drizzle) first, falls back to Supabase.
 */
export const getDbUserId = cache(async (clerkUserId: string): Promise<string | null> => {
  if (process.env.DATABASE_URL) {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkUserId),
        columns: { id: true },
      });
      if (result?.id) return result.id;
    } catch (neonErr) {
      console.warn("[getDbUserId] Neon query failed, falling back to Supabase:", neonErr);
    }
  }

  // Fallback to legacy Supabase lookup
  return await ensureSupabaseUser(clerkUserId);
});

/**
 * Ensure user exists in database with Clerk ID and email.
 * Upserts user record with fallback support.
 */
export const ensureDbUser = cache(async (clerkUserId: string, email?: string): Promise<string | null> => {
  if (process.env.DATABASE_URL) {
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
    } catch (neonErr) {
      console.warn("[ensureDbUser] Neon upsert failed, falling back to Supabase:", neonErr);
    }
  }

  // Fallback to legacy Supabase
  return await ensureSupabaseUser(clerkUserId, email);
});
