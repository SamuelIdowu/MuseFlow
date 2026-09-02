"use client";

import { useState } from "react";
import { Sparkles, Calendar, Copy, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Idea {
    id: string;
    title: string;
    description: string;
    tags: string[];
    createdAt: string;
    status: "new" | "saved";
}

interface ExpandableIdeaCardProps {
    idea: Idea;
    onSchedule: (idea: Idea) => void;
    onDelete: (id: string) => void;
}

export function ExpandableIdeaCard({ idea, onSchedule, onDelete }: ExpandableIdeaCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Export functionality
    const exportIdea = (format: "copy" | "download") => {
        const content = `${idea.title}\n\n${idea.description}\n\nTags: ${idea.tags.join(", ")}`;

        if (format === "copy") {
            navigator.clipboard.writeText(content);
            import("react-hot-toast").then(({ toast }) => {
                toast.success("Idea copied to clipboard!");
            });
        } else {
            // Create a downloadable file
            const element = document.createElement("a");
            const file = new Blob([content], { type: "text/plain" });
            element.href = URL.createObjectURL(file);
            element.download = `idea-${idea.id}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            import("react-hot-toast").then(({ toast }) => {
                toast.success("Idea downloaded!");
            });
        }
    };

    // Truncate description for card
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const shouldShowReadMore = idea.description.length > 100;

    return (
        <>
            <Card className="border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all w-full overflow-hidden rounded-xl">
                <CardHeader className="p-4 pb-3 border-b border-border bg-muted/20">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                            {idea.title}
                        </CardTitle>
                        <Badge
                            variant={idea.status === "new" ? "default" : "secondary"}
                            className="ml-2 font-semibold text-[10px] uppercase tracking-wider shrink-0"
                        >
                            {idea.status}
                        </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground font-medium">{idea.createdAt}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Description with Read More button */}
                    <div>
                        <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed break-words">
                            {truncateText(idea.description, 100)}
                        </p>
                        {shouldShowReadMore && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-xs font-semibold text-primary hover:underline mt-1.5 block"
                            >
                                Read more →
                            </button>
                        )}
                    </div>

                    {/* Always visible tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {idea.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] font-medium bg-muted/60 text-foreground border-border">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    {/* Always visible action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
                        <Button variant="outline" size="sm" asChild className="h-7 text-xs font-semibold border-border hover:bg-muted">
                            <Link href={`/dashboard/canvas?ideaId=${idea.id}`}>
                                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                Use Idea
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-medium text-foreground hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSchedule(idea);
                            }}
                        >
                            <Calendar className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Schedule
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                exportIdea("copy");
                            }}
                            title="Copy idea"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                exportIdea("download");
                            }}
                            title="Download idea"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(idea.id);
                            }}
                            title="Delete idea"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Modal for full description */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{idea.title}</DialogTitle>
                        <DialogDescription>{idea.createdAt}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {idea.description}
                            </p>
                        </div>
                        {idea.tags.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {idea.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
