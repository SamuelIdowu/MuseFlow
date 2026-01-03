"use client";

import { useState, useEffect, useCallback } from "react";
import { CampaignGenerator } from "@/components/campaigns/CampaignGenerator";
import { SavedCampaignCard } from "@/components/campaigns/SavedCampaignCard";
import { getSavedCampaignsAction, SavedCampaign } from "@/lib/campaignActions";
import { Loader2 } from "lucide-react";

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Campaign Generator</h2>
                <p className="text-muted-foreground">
                    Generate bulk content aligned with your active profile.
                </p>
            </div>
            <div className="pt-4">
                <CampaignGenerator onSaved={handleSaved} />
            </div>

            {/* Campaign History Section */}
            <div className="pt-8">
                <h3 className="text-2xl font-semibold tracking-tight mb-4">Campaign History</h3>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : savedCampaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No saved campaigns yet.</p>
                        <p className="text-sm">Generate and save a campaign to see it here.</p>
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
