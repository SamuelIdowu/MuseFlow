import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfilesLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>

        {/* Search Bar Skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Grid of Profile Cards (3 cols) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/60 bg-card/80 py-4 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 px-4 pb-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <div className="space-y-2 py-2 border-y border-border/40">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
