"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { ScheduleDialog } from "@/components/modals/ScheduleDialog";
import { toast } from "react-hot-toast";
import { getUserIdeasAction, deleteIdeaAction } from "@/lib/dashboardServerActions";
import { ExpandableIdeaCard } from "@/components/ExpandableIdeaCard";
import { Profile } from "@/types/profile";

interface Idea {
    id: string;
    title: string;
    description: string;
    tags: string[];
    createdAt: string;
    status: "new" | "saved";
}

interface SupabaseIdea {
    id: string;
    input_data: string;
    kernels: (string | null)[];
    created_at: string;
}

interface IdeasPageClientProps {
    activeProfile: Profile | null;
}

export function IdeasPageClient({ activeProfile }: IdeasPageClientProps) {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const { user, isLoaded } = useUser();

    // Fetch ideas from Supabase
    useEffect(() => {
        const fetchIdeas = async () => {
            if (!isLoaded) return;

            if (!user) {
                // Let middleware handle this, or redirect if needed
                return;
            }

            try {
                // Fetch user's idea kernels using server action
                const supabaseIdeas = await getUserIdeasAction();

                // Transform the data to match our Idea interface
                const transformedIdeas: Idea[] = (supabaseIdeas as SupabaseIdea[]).map((idea) => ({
                    id: idea.id,
                    title:
                        Array.isArray(idea.kernels) && idea.kernels.length > 0 && typeof idea.kernels[0] === 'string'
                            ? idea.kernels[0]
                            : "Untitled Idea", // Use first kernel as title
                    description: idea.input_data || "No description available",
                    tags:
                        Array.isArray(idea.kernels) && idea.kernels.length > 1
                            ? idea.kernels.slice(1, 4).filter((kernel): kernel is string => typeof kernel === 'string')
                            : [], // Use the next few kernels as tags
                    createdAt: new Date(idea.created_at).toISOString().split("T")[0], // Format date as YYYY-MM-DD
                    status: "saved", // All database ideas are considered saved
                }));

                setIdeas(transformedIdeas);
            } catch (error) {
                console.error("Error fetching ideas:", error);
                toast.error("Failed to load ideas. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchIdeas();
    }, [user, isLoaded]);

    const handleScheduleIdea = useCallback(async (post: {
        title: string;
        content: string;
        channel: string;
        scheduledTime: string;
        optimizeTime: boolean;
        ideaId?: string;
    }) => {
        try {
            const response = await fetch("/api/ideas/schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: post.title,
                    content: post.content,
                    channel: post.channel,
                    scheduled_time: post.scheduledTime,
                    optimize_time: post.optimizeTime,
                    idea_id: post.ideaId || selectedIdea?.id,
                    active_profile: activeProfile,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to schedule post");
            }

            const scheduledPost = await response.json();
            toast.success("Post scheduled successfully!");
            console.log("Scheduled post:", scheduledPost);
        } catch (error) {
            console.error("Error scheduling post:", error);
            toast.error("Failed to schedule post. Please try again.");
        }
    }, [selectedIdea?.id, activeProfile]);

    const handleDeleteIdea = async (id: string) => {
        if (!confirm("Are you sure you want to delete this idea?")) return;

        try {
            await deleteIdeaAction(id);
            setIdeas((prev) => prev.filter((idea) => idea.id !== id));
            toast.success("Idea deleted successfully");
        } catch (error) {
            console.error("Error deleting idea:", error);
            toast.error("Failed to delete idea");
        }
    };

    const openScheduleDialog = (idea: Idea) => {
        setSelectedIdea(idea);
        setIsScheduleDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading your ideas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight">Generated Ideas</h2>
                        {activeProfile ? (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                Active: {activeProfile.profile_name}
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-500 ring-1 ring-inset ring-yellow-600/20">
                                No Active Profile
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Browse your AI-generated content ideas and start creating
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Generate New Ideas
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ideas.map((idea) => (
                    <ExpandableIdeaCard
                        key={idea.id}
                        idea={idea}
                        onSchedule={openScheduleDialog}
                        onDelete={handleDeleteIdea}
                    />
                ))}
            </div>

            {/* Schedule Dialog */}
            {selectedIdea && (
                <ScheduleDialog
                    isOpen={isScheduleDialogOpen}
                    onOpenChange={setIsScheduleDialogOpen}
                    ideaTitle={selectedIdea.title}
                    ideaDescription={selectedIdea.description}
                    ideaId={selectedIdea.id}
                    onSchedule={handleScheduleIdea}
                    activeProfile={activeProfile}
                />
            )}

            {ideas.length === 0 && (
                <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                        <Sparkles className="h-full w-full" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No ideas generated yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Generate your first content ideas to get started
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">Generate Ideas</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
