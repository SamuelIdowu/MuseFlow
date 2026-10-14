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

export async function getProfileByIdFromDb(userId: string, profileId: string) {
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.userId, userId)),
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

export async function updateProfileInDb(
  userId: string,
  profileId: string,
  data: {
    profile_name?: string;
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

  const updateSet: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.profile_name !== undefined) updateSet.profileName = data.profile_name;
  if (data.niche !== undefined) updateSet.niche = data.niche;
  if (data.tone_config !== undefined) updateSet.toneConfig = data.tone_config;
  if (data.default_content_type !== undefined) updateSet.defaultContentType = data.default_content_type;
  if (data.samples !== undefined) updateSet.samples = data.samples;
  if (data.is_active !== undefined) updateSet.isActive = data.is_active;

  const [updated] = await db
    .update(profiles)
    .set(updateSet)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .returning();

  if (!updated) return null;

  return {
    id: updated.id,
    user_id: updated.userId,
    profile_name: updated.profileName,
    niche: updated.niche,
    tone_config: updated.toneConfig,
    samples: updated.samples,
    default_content_type: updated.defaultContentType,
    is_active: updated.isActive,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  };
}

export async function activateProfileInDb(userId: string, profileId: string) {
  // Deactivate all first
  await db
    .update(profiles)
    .set({ isActive: false })
    .where(eq(profiles.userId, userId));

  // Activate selected profile
  const [activated] = await db
    .update(profiles)
    .set({ isActive: true, updatedAt: new Date() })
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .returning();

  if (!activated) return null;

  return {
    id: activated.id,
    user_id: activated.userId,
    profile_name: activated.profileName,
    niche: activated.niche,
    tone_config: activated.toneConfig,
    samples: activated.samples,
    default_content_type: activated.defaultContentType,
    is_active: activated.isActive,
    created_at: activated.createdAt.toISOString(),
    updated_at: activated.updatedAt.toISOString(),
  };
}

export async function deleteProfileInDb(userId: string, profileId: string) {
  await db
    .delete(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)));
  return true;
}
