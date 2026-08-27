import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/40">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Grid of Settings Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Card 1: Notification Settings */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 2: Content Preferences */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-52" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Billing & Subscription */}
        <Card className="border-border/60 bg-card/80 md:col-span-2">
          <CardHeader className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}
