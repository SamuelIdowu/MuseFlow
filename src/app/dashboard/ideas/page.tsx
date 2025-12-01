import { getActiveProfile } from "@/lib/dashboardServerActions";
import { IdeasPageClient } from "./IdeasPageClient";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function IdeasPage() {
  const activeProfile = await getActiveProfile();

  return <IdeasPageClient activeProfile={activeProfile} />;
}
