"use client";

import { useState } from "react";
import { CalendarIcon, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ScheduledPost {
    id: string;
    content_blocks: Array<{ content: string; type: string }>;
    channel: string;
    scheduled_time: string;
    status: string;
    created_at: string;
}

interface ScheduledPostCardProps {
    post: ScheduledPost;
    onDelete: (id: string) => void;
}

const getChannelLabel = (channel: string) => {
    switch (channel) {
        case 'linkedin': return 'LinkedIn';
        case 'x': return 'X (Twitter)';
        case 'blog': return 'Blog';
        case 'twitter': return 'Twitter';
        case 'facebook': return 'Facebook';
        case 'instagram': return 'Instagram';
        default: return channel;
    }
};

export function ScheduledPostCard({ post, onDelete }: ScheduledPostCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get content preview
    const contentPreview = Array.isArray(post.content_blocks) && post.content_blocks.length > 0
        ? post.content_blocks[0].content || 'No content'
        : 'No content';

    // Get full content
    const fullContent = Array.isArray(post.content_blocks)
        ? post.content_blocks.map(block => block.content).join('\n\n')
        : 'No content';

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const shouldShowReadMore = contentPreview.length > 100;

    return (
        <>
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex justify-between items-start">
                <div className="space-y-1 flex-1">
                    <p className="text-sm text-muted-foreground">
                        {truncateText(contentPreview, 100)}
                    </p>
                    {shouldShowReadMore && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-sm text-primary hover:underline"
                        >
                            Read more
                        </button>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{getChannelLabel(post.channel)}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(post.scheduled_time), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(post.scheduled_time), 'h:mm a')}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 ml-4">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(post.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Modal for full content */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Scheduled Post</DialogTitle>
                        <DialogDescription>
                            {format(new Date(post.scheduled_time), 'MMM d, yyyy')} at {format(new Date(post.scheduled_time), 'h:mm a')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Content</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {fullContent}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Details</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Channel:</span>
                                    <Badge variant="outline">{getChannelLabel(post.channel)}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{format(new Date(post.scheduled_time), 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{format(new Date(post.scheduled_time), 'h:mm a')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
