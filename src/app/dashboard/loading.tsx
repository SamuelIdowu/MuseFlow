import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4">
            {/* Scrollable Area Skeleton */}
            <div className="flex-1 space-y-8 overflow-hidden">

                {/* Header/Greeting Skeleton */}
                <div className="flex flex-col items-center space-y-4 mt-10 md:mt-20">
                    <Skeleton className="h-10 w-[250px] md:w-[400px]" /> {/* "What do you want to create?" */}
                    <Skeleton className="h-6 w-[200px]" /> {/* Active Profile Text */}
                    <div className="flex gap-2 mt-2">
                        <Skeleton className="h-6 w-20 rounded-full" /> {/* Niche/Tone tags */}
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mt-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-muted/10 border rounded-xl p-4 flex flex-col items-center justify-center space-y-3 h-32">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Input Area Sticky Footer Skeleton */}
            <div className="mt-auto pt-4 bg-background/80 backdrop-blur-sm sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto space-y-2">
                    {/* Controls Bar */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>

                    {/* Textarea */}
                    <Skeleton className="h-[60px] w-full max-w-3xl mx-auto rounded-xl" />
                </div>
            </div>
        </div>
    );
}
