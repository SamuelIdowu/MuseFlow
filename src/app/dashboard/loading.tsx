import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        {/* 1. Header / Executive Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-36 rounded-full hidden sm:block" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-8.5 w-24 rounded-md" />
            <Skeleton className="h-8.5 w-24 rounded-md" />
            <Skeleton className="h-8.5 w-24 rounded-md hidden md:block" />
            <Skeleton className="h-8.5 w-20 rounded-md hidden lg:block" />
          </div>
        </div>

        {/* 2. Key Metrics & AI Allowance Grid (5 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
          {/* AI Allowance card skeleton */}
          <Card className="border-border/60 bg-card/80 p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </Card>
        </div>

        {/* 3. Instant Content Catalyst Skeleton */}
        <Card className="border-border/60 bg-card/80 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg mt-2" />
          <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-40 rounded hidden sm:block" />
          </div>
        </Card>

        {/* 4. Workspace Activity & Radar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Recent Work Tabs */}
          <div className="lg:col-span-8">
            <Card className="border-border/60 bg-card/80">
              <CardHeader className="p-4 pb-3 border-b border-border/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-8 w-64 rounded-md" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3.5 rounded-lg border border-border/60 space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-full rounded" />
                      <div className="flex justify-between pt-2 border-t border-border/40">
                        <Skeleton className="h-6 w-12 rounded" />
                        <div className="flex gap-1">
                          <Skeleton className="h-6 w-14 rounded" />
                          <Skeleton className="h-6 w-12 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Brand Voice Radar & Workflows */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Brand Voice Radar Card */}
            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-6 rounded" />
              </div>
              <div className="space-y-3 mt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-border/40">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            </Card>

            {/* Quick Workflows Card */}
            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="space-y-2.5 mt-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1">
                      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-2.5 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
