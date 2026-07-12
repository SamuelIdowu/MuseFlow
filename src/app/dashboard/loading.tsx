import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-background relative overflow-hidden">
            {/* Header Controls Skeleton */}
            <div className="flex items-center justify-between p-4 z-10">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-32 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full overflow-hidden">
                <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-10 max-w-5xl mx-auto w-full z-10">
                    
                    {/* Hero Section Skeleton */}
                    <div className="flex flex-col items-center space-y-6 text-center mt-10">
                        {/* Orb Visual Skeleton */}
                        <div className="relative w-24 h-24 mb-4">
                            <Skeleton className="absolute inset-0 rounded-full" />
                        </div>
                        <Skeleton className="h-12 w-[300px] md:w-[500px]" />
                    </div>

                    {/* Quick Actions Skeleton */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Skeleton className="h-10 w-32 rounded-full" />
                        <Skeleton className="h-10 w-32 rounded-full" />
                        <Skeleton className="h-10 w-32 rounded-full" />
                    </div>

                    {/* Center Input Area Skeleton */}
                    <div className="w-full max-w-3xl">
                        <Skeleton className="h-[120px] w-full rounded-xl" />
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mt-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-muted/10 border rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
