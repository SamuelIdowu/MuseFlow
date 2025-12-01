/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, Trash2 } from "lucide-react";
import { Profile, ToneConfig } from "@/types/profile";

interface ProfileCardProps {
    profile: Profile;
    onEdit: (profile: Profile) => void;
    onDelete: (profileId: string) => void;
    onSetActive: (profileId: string) => void;
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

export function ProfileCard({ profile, onEdit, onDelete, onSetActive }: ProfileCardProps) {
    const isActive = profile.is_active;
    const toneKeywords = getToneKeywords(profile.tone_config);

    return (
        <Card
            className={`flex flex-col gap-4 p-4 relative transition-all ${isActive
                ? "border-2 border-primary bg-primary/5 dark:bg-primary/10"
                : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111c22]"
                }`}
        >
            {isActive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary/20 text-primary dark:text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4" fill="currentColor" />
                    <span>Active</span>
                </div>
            )}

            <CardHeader className="p-0 space-y-0">
                <div className="flex flex-col">
                    <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal">
                        {profile.profile_name}
                    </p>
                    <p className="text-gray-500 dark:text-[#92b7c9] text-sm font-normal leading-normal">
                        {profile.niche ? `Niche: ${profile.niche}` : "No niche specified"}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col gap-4">
                <div>
                    <h3 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        Tone & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {toneKeywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                <div
                    className={`flex mt-auto pt-4 border-t ${isActive
                        ? "border-primary/20 dark:border-primary/30"
                        : "border-gray-200 dark:border-gray-800"
                        }`}
                >
                    {!isActive && (
                        <Button
                            className="w-full mb-2 bg-primary text-gray-800 hover:bg-primary/90"
                            onClick={() => onSetActive(profile.id)}
                        >
                            Set as Active
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => onEdit(profile)}
                    >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                    </Button>
                    <Button
                        variant="secondary"
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => onDelete(profile.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
