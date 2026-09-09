/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, Trash2, Cpu, MoreHorizontal } from "lucide-react";
import { Profile, ToneConfig } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileCardProps {
    profile: Profile;
    onEdit: (profile: Profile) => void;
    onDelete: (profileId: string) => void;
    onSetActive: (profileId: string) => void;
    onConfigureBYOK?: (profile: Profile) => void;
}

// Extract tone keywords from tone_config
function getToneKeywords(toneConfig: ToneConfig | null): string[] {
    if (!toneConfig) return [];

    const keywords: string[] = [];
    const { professionalism, creativity, casualness, directness } = toneConfig;

    // Add keywords based on tone values
    if (professionalism && professionalism > 70) keywords.push("Professional");
    if (creativity && creativity > 70) keywords.push("Creative");
    if (casualness && casualness > 70) keywords.push("Casual");
    if (directness && directness > 70) keywords.push("Direct");

    // Add keywords based on combinations
    if (professionalism && professionalism > 50 && creativity && creativity > 50) {
        keywords.push("Witty");
    }
    if (casualness && casualness > 50 && directness && directness < 50) {
        keywords.push("Informative");
    }

    return keywords.length > 0 ? keywords : ["Standard"];
}

export function ProfileCard({ profile, onEdit, onDelete, onSetActive, onConfigureBYOK }: ProfileCardProps) {
    const isActive = profile.is_active;
    const toneKeywords = getToneKeywords(profile.tone_config);

    return (
        <Card
            className={`flex flex-col justify-between p-5 relative transition-all duration-200 rounded-xl shadow-xs ${isActive
                ? "ring-2 ring-primary/60 bg-primary/5 border-primary/40 shadow-sm"
                : "border-border bg-card hover:border-border/80 hover:shadow-sm"
                }`}
        >
            <CardHeader className="p-0 space-y-0 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-foreground text-base sm:text-lg font-bold leading-snug font-space-grotesk truncate">
                                {profile.profile_name}
                            </p>
                            {isActive && (
                                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-semibold gap-1 py-0.5 px-2 hover:bg-primary/20">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Active</span>
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs font-normal mt-0.5 truncate">
                            {profile.niche ? `Niche: ${profile.niche}` : "General Creator"}
                        </p>
                    </div>

                    {/* Overflow Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 -mt-1 -mr-1"
                                title="Profile options"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs font-medium">
                            {onConfigureBYOK && (
                                <DropdownMenuItem
                                    onClick={() => onConfigureBYOK(profile)}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Model & BYOK Settings</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onEdit(profile)}
                                className="cursor-pointer flex items-center gap-2"
                            >
                                <Edit className="h-3.5 w-3.5 text-sky-500" />
                                <span>Edit Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(profile.id)}
                                className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Profile</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col gap-4">
                <div>
                    <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-2">
                        Tone & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {toneKeywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="bg-muted/80 text-foreground text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-border/80"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer Action / Status */}
                <div className="mt-auto pt-3.5 border-t border-border/70 flex items-center justify-between">
                    {isActive ? (
                        <div className="flex items-center text-xs font-medium text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-2xs" />
                            <span>Currently generating in this persona</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs font-medium border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            onClick={() => onSetActive(profile.id)}
                        >
                            Set as Active Voice
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

