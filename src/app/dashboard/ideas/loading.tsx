import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function IdeasLoading() {
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden p-1">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1 border-b border-border/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-full md:w-44 rounded-md" />
      </div>

      {/* Grid of 6 Idea Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/60 bg-card/80 py-4 shadow-sm">
            <CardHeader className="space-y-1.5 px-4 pb-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-3 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <Skeleton className="h-16 w-full rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/40">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
