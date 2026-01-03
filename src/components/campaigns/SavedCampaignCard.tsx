"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Copy, Twitter, Linkedin } from "lucide-react";
import { deleteSavedCampaignAction, SavedCampaign } from "@/lib/campaignActions";
import toast from "react-hot-toast";

interface SavedCampaignCardProps {
    campaign: SavedCampaign;
    onDeleted: () => void;
}

export function SavedCampaignCard({ campaign, onDeleted }: SavedCampaignCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDelete = () => {
        startDeleteTransition(async () => {
            try {
                await deleteSavedCampaignAction(campaign.id);
                toast.success("Campaign deleted");
                onDeleted();
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete campaign");
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const copyAllPosts = () => {
        const allContent = campaign.posts.map((p, i) => `Post ${i + 1} (${p.type}):\n${p.content}`).join("\n\n---\n\n");
        navigator.clipboard.writeText(allContent);
        toast.success("All posts copied to clipboard");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPlatformIcon = () => {
        if (campaign.platform === "linkedin") {
            return <Linkedin className="h-4 w-4 text-blue-600" />;
        }
        return <Twitter className="h-4 w-4 text-black dark:text-white" />;
    };

    return (
        <Card className="border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {getPlatformIcon()}
                            <CardTitle className="text-lg line-clamp-1">{campaign.topic}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded capitalize">{campaign.platform}</span>
                            <span className="bg-muted px-2 py-0.5 rounded capitalize">{campaign.tone}</span>
                            <span>{campaign.posts.length} posts</span>
                            <span>•</span>
                            <span>{formatDate(campaign.created_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={copyAllPosts}
                            title="Copy all posts"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete campaign"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {campaign.posts.map((post, i) => (
                            <div
                                key={i}
                                className="relative group p-3 bg-muted/50 rounded-lg border"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono bg-background px-2 py-0.5 rounded uppercase">
                                        {post.type}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(post.content)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-sm whitespace-pre-wrap line-clamp-6">{post.content}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
