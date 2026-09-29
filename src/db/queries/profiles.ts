import { db } from "../index";
import { profiles } from "../schema/profiles";
import { eq, and, desc } from "drizzle-orm";

export async function getActiveProfileFromDb(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.userId, userId), eq(profiles.isActive, true)),
  });

  if (!profile) return null;

  return {
    id: profile.id,
    user_id: profile.userId,
    profile_name: profile.profileName,
    niche: profile.niche,
    tone_config: profile.toneConfig,
    samples: profile.samples,
    default_content_type: profile.defaultContentType,
    is_active: profile.isActive,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };
}

export async function getUserProfilesFromDb(userId: string) {
  const allProfiles = await db.query.profiles.findMany({
    where: eq(profiles.userId, userId),
    orderBy: [desc(profiles.createdAt)],
  });

  return allProfiles.map((p) => ({
    id: p.id,
    user_id: p.userId,
    profile_name: p.profileName,
    niche: p.niche,
    tone_config: p.toneConfig,
    samples: p.samples,
    default_content_type: p.defaultContentType,
    is_active: p.isActive,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }));
}

export async function createProfileInDb(
  userId: string,
  data: {
    profile_name: string;
    niche?: string | null;
    tone_config?: any;
    default_content_type?: string | null;
    samples?: any;
    is_active?: boolean;
  }
) {
  if (data.is_active) {
    await db
      .update(profiles)
      .set({ isActive: false })
      .where(eq(profiles.userId, userId));
  }

  const [created] = await db
    .insert(profiles)
    .values({
      userId,
      profileName: data.profile_name,
      niche: data.niche || null,
      toneConfig: data.tone_config || null,
      defaultContentType: data.default_content_type || null,
      samples: data.samples || null,
      isActive: data.is_active || false,
    })
    .returning();

  return {
    id: created.id,
    user_id: created.userId,
    profile_name: created.profileName,
    niche: created.niche,
    tone_config: created.toneConfig,
    samples: created.samples,
    default_content_type: created.defaultContentType,
    is_active: created.isActive,
    created_at: created.createdAt.toISOString(),
    updated_at: created.updatedAt.toISOString(),
  };
}
