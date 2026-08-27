import { Skeleton } from "@/components/ui/skeleton";

export default function CanvasLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-background relative">
      {/* Top Toolbar Skeleton */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md hidden sm:block" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Canvas Workspace Area Skeleton */}
      <div className="flex-1 relative overflow-hidden bg-muted/10">
        {/* Floating Canvas Node Skeletons simulating node graph */}
        <div className="absolute top-16 left-12 w-72 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-14 w-full rounded" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        </div>

        <div className="absolute top-28 left-[400px] w-80 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse hidden md:block">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-20 w-full rounded" />
          <div className="flex justify-between pt-1">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>

        <div className="absolute bottom-20 left-[260px] w-72 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse hidden lg:block">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-16 w-full rounded" />
        </div>

        {/* Floating Zoom & Controls Skeleton */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-1 p-1 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-md">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>

        {/* MiniMap Skeleton */}
        <div className="absolute bottom-6 right-6 w-36 h-24 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-md p-2 hidden sm:block">
          <Skeleton className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}
