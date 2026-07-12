"use client";

import { useState, useEffect, useCallback } from "react";
import { CampaignGenerator } from "@/components/campaigns/CampaignGenerator";
import { SavedCampaignCard } from "@/components/campaigns/SavedCampaignCard";
import { getSavedCampaignsAction, SavedCampaign } from "@/lib/campaignActions";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CampaignPage() {
    const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCampaigns = useCallback(async () => {
        try {
            const campaigns = await getSavedCampaignsAction();
            setSavedCampaigns(campaigns);
        } catch (error) {
            console.error("Failed to fetch saved campaigns:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleSaved = () => {
        fetchCampaigns();
    };

    const handleDeleted = () => {
        fetchCampaigns();
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Campaign Generator</h2>
                <p className="text-sm text-muted-foreground">
                    Generate bulk content aligned with your active profile.
                </p>
            </div>
            <div className="pt-2">
                <CampaignGenerator onSaved={handleSaved} />
            </div>

            {/* Campaign History Section */}
            <div className="pt-6">
                <h3 className="text-lg font-semibold tracking-tight mb-4">Campaign History</h3>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i} className="overflow-hidden py-4">
                                <CardHeader className="px-4 pb-2">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-5 w-1/3" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 space-y-3">
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : savedCampaigns.length === 0 ? (
                    <div className="text-center py-10 border rounded-xl border-dashed">
                        <p className="text-muted-foreground">No saved campaigns yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Generate and save a campaign to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedCampaigns.map((campaign) => (
                            <SavedCampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                onDeleted={handleDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
