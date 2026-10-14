import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getActiveProfile } from "@/lib/dashboardServerActions";
import { CanvasPageClient } from "./CanvasPageClient";
import { CanvasSkeleton } from "@/features/canvas/components/canvas/CanvasSkeleton";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function CanvasPage() {
  const { userId: clerkId } = await auth();
  const activeProfile = await getActiveProfile();

  return (
    <Suspense fallback={<CanvasSkeleton />}>
      <CanvasPageClient activeProfile={activeProfile} clerkId={clerkId} />
    </Suspense>
  );
}
