import { getActiveProfile } from "@/lib/dashboardServerActions";
import { CanvasPageClient } from "./CanvasPageClient";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function CanvasPage() {
  const activeProfile = await getActiveProfile();

  return <CanvasPageClient activeProfile={activeProfile} />;
}
