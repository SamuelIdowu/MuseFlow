import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CampaignsLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/40">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Campaign Generator Form Skeleton */}
      <Card className="border-border/60 bg-card/80 p-6 shadow-sm space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
      </Card>

      {/* Campaign History Section Skeleton */}
      <div className="pt-4 space-y-4">
        <Skeleton className="h-6 w-40" />

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/60 bg-card/80 p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
