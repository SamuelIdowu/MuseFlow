import { db } from "../index";
import { savedCampaigns } from "../schema/billing";
import { eq, and, desc } from "drizzle-orm";

interface CampaignPost {
  content: string;
  type: string;
}

export async function saveCampaignInDb(
  userId: string,
  topic: string,
  platform: string,
  tone: string,
  posts: CampaignPost[]
) {
  const [created] = await db
    .insert(savedCampaigns)
    .values({
      userId,
      topic,
      platform,
      tone,
      posts: JSON.parse(JSON.stringify(posts)),
    })
    .returning();

  return {
    id: created.id,
    user_id: created.userId,
    topic: created.topic,
    platform: created.platform,
    tone: created.tone,
    posts: created.posts as unknown as CampaignPost[],
    created_at: created.createdAt.toISOString(),
  };
}

export async function getSavedCampaignsFromDb(userId: string) {
  const campaigns = await db.query.savedCampaigns.findMany({
    where: eq(savedCampaigns.userId, userId),
    orderBy: [desc(savedCampaigns.createdAt)],
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    user_id: campaign.userId,
    topic: campaign.topic,
    platform: campaign.platform,
    tone: campaign.tone,
    posts: campaign.posts as unknown as CampaignPost[],
    created_at: campaign.createdAt.toISOString(),
  }));
}

export async function deleteSavedCampaignFromDb(userId: string, id: string) {
  await db
    .delete(savedCampaigns)
    .where(and(eq(savedCampaigns.id, id), eq(savedCampaigns.userId, userId)));
}
