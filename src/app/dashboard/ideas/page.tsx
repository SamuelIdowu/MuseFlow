"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Sparkles, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { ScheduleDialog } from "@/components/modals/ScheduleDialog";
import { toast } from "react-hot-toast";
import { ideasService } from "@/lib/supabaseService";
import { createBrowserClient } from "@supabase/ssr";

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

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  // Fetch ideas from Supabase
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        // Get current user from Supabase (this should now work with Clerk webhook)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Middleware should handle redirect, but this is a fallback
          router.push("/auth/login");
          return;
        }

        // Fetch user's idea kernels from the database
        const supabaseIdeas = await ideasService.getUserIdeas(user.id);

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
  }, [supabase, router]);

  const handleScheduleIdea = async (post: {
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
          <h2 className="text-2xl font-bold tracking-tight">Generated Ideas</h2>
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
          <Card
            key={idea.id}
            className="group hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {idea.title}
                </CardTitle>
                <Badge
                  variant={idea.status === "new" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {idea.status}
                </Badge>
              </div>
              <CardDescription>{idea.createdAt}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{idea.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {idea.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/canvas?ideaId=${idea.id}`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use Idea
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openScheduleDialog(idea)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
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
