import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="h-[calc(100vh-65px)] w-full flex flex-col overflow-hidden bg-muted/20">
      {/* Top Header Bar Skeleton */}
      <div className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between gap-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Main 3-Column Studio Layout Skeleton */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Creator Companion Skeleton */}
        <aside className="w-64 border-r border-border/60 bg-card/50 p-4 space-y-4 hidden md:flex flex-col flex-shrink-0">
          <div className="space-y-1.5 pb-3 border-b border-border/40">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="flex-1" />
          <div className="p-3 rounded-lg border border-border/50 bg-background/60 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </aside>

        {/* Middle Column: Document Sheet Canvas Skeleton */}
        <main className="flex-1 h-full overflow-y-auto px-4 sm:px-12 py-8 bg-zinc-100/70 dark:bg-zinc-950/60 flex justify-center">
          <div className="w-full max-w-3xl min-h-[750px] p-8 sm:p-12 rounded-xl bg-card border border-border/60 shadow-sm space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
            </div>
          </div>
        </main>

        {/* Right Column: AI Writing Copilot Skeleton */}
        <aside className="w-80 border-l border-border/60 bg-card/60 p-4 space-y-4 hidden lg:flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>

          <div className="flex-1 space-y-3 overflow-hidden">
            <div className="p-3 rounded-lg bg-muted/40 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <div className="p-3 rounded-lg bg-primary/10 ml-6 space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-2">
            <Skeleton className="h-16 w-full rounded-md" />
            <div className="flex justify-end">
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
