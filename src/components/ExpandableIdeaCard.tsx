"use client";

import { useState } from "react";
import { Sparkles, Calendar, Copy, Download, Trash2, FileEdit, MoreHorizontal, ArrowRight } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                                className="text-xs font-semibold text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
                            >
                                <span>Read more</span>
                                <ArrowRight className="h-3 w-3" />
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

                    {/* Compacted Action Bar: 1 Primary CTA + Overflow Menu */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-border/80">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs font-semibold gap-1.5 px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-2xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                try {
                                    localStorage.setItem(
                                        'museflow_editor_import',
                                        JSON.stringify({
                                            title: idea.title,
                                            content: idea.description,
                                            channel: 'all',
                                            importedAt: new Date().toISOString(),
                                        })
                                    );
                                    window.location.href = `/dashboard/editor?import=${Date.now()}`;
                                } catch {
                                    window.location.href = '/dashboard/editor';
                                }
                            }}
                        >
                            <FileEdit className="h-3.5 w-3.5 text-primary" />
                            <span>Open in Editor</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={(e) => e.stopPropagation()}
                                    title="More options"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs font-medium">
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/canvas?ideaId=${idea.id}`} className="cursor-pointer flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                                        <span>Open in Canvas</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSchedule(idea);
                                    }}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Schedule Post</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportIdea("copy");
                                    }}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Copy Text</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportIdea("download");
                                    }}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Download (.txt)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(idea.id);
                                    }}
                                    className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
