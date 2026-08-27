import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function BillingLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-1.5 pb-2 border-b border-border/40">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Subscription Plan Card Skeleton */}
      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardHeader className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 pt-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
