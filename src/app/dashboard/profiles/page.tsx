/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { ProfileFormDialog } from "@/components/dashboard/ProfileFormDialog";
import toast from "react-hot-toast";
import { Search, PlusCircle, Archive } from "lucide-react";
import { Profile } from "@/types/profile";

export default function ProfilesManagementPage() {
    const { user: clerkUser } = useUser();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            if (!clerkUser) {
                toast.error("User not authenticated. Please log in.");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/profiles");

            if (!response.ok) {
                throw new Error("Failed to fetch profiles");
            }

            const data = await response.json();
            setProfiles(data.profiles || []);
            setFilteredProfiles(data.profiles || []);
        } catch (error: unknown) {
            console.error("Error fetching profiles:", error);
            toast.error("Failed to load profiles");
        } finally {
            setLoading(false);
        }
    }, [clerkUser]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    // Filter profiles based on search query
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProfiles(profiles);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredProfiles(
                profiles.filter(
                    (profile) =>
                        (profile.profile_name && profile.profile_name.toLowerCase().includes(query)) ||
                        (profile.niche && profile.niche.toLowerCase().includes(query))
                )
            );
        }
    }, [searchQuery, profiles]);

    const handleCreateProfile = async (profileData: any) => {
        try {
            const response = await fetch("/api/profiles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(profileData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create profile");
            }

            toast.success("Profile created successfully!");
            await fetchProfiles();
        } catch (error: unknown) {
            console.error("Error creating profile:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create profile"
            );
            throw error;
        }
    };

    const handleEditProfile = async (profileData: any) => {
        if (!selectedProfile) return;

        try {
            const response = await fetch(`/api/profiles/${selectedProfile.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(profileData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");
            await fetchProfiles();
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to update profile"
            );
            throw error;
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!confirm("Are you sure you want to delete this profile?")) {
            return;
        }

        try {
            const response = await fetch(`/api/profiles/${profileId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete profile");
            }

            toast.success("Profile deleted successfully!");
            await fetchProfiles();
        } catch (error: unknown) {
            console.error("Error deleting profile:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to delete profile"
            );
        }
    };

    const handleSetActiveProfile = async (profileId: string) => {
        try {
            const response = await fetch(`/api/profiles/${profileId}/activate`, {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to activate profile");
            }

            toast.success("Profile set as active!");
            await fetchProfiles();
        } catch (error: unknown) {
            console.error("Error activating profile:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to activate profile"
            );
        }
    };

    const openCreateDialog = () => {
        setSelectedProfile(null);
        setDialogMode("create");
        setDialogOpen(true);
    };

    const openEditDialog = (profile: Profile) => {
        setSelectedProfile(profile);
        setDialogMode("edit");
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading profiles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Page Heading */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                            Content Profiles
                        </h1>
                        <p className="text-gray-500 dark:text-[#92b7c9] text-base font-normal leading-normal">
                            Manage your brand identities. The active profile will guide the AI
                            in generating new content.
                        </p>
                    </div>
                    <Button
                        onClick={openCreateDialog}
                        className="flex items-center justify-center gap-2 bg-primary text-gray-800 hover:bg-primary/90"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Create New Profile</span>
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#92b7c9] h-5 w-5" />
                        <Input
                            className="w-full h-12 pl-12 bg-white dark:bg-[#233c48] border-gray-200 dark:border-gray-700 focus-visible:ring-primary"
                            placeholder="Find a profile by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Profiles Grid or Empty State */}
                {filteredProfiles.length === 0 ? (
                    <div className="pt-16">
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-primary">
                                <Archive className="h-24 w-24" strokeWidth={1} />
                            </div>
                            <div className="flex max-w-md flex-col items-center gap-2 text-center">
                                <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                                    {searchQuery
                                        ? "No profiles found"
                                        : "No profiles yet"}
                                </p>
                                <p className="text-gray-500 dark:text-[#92b7c9] text-sm font-normal leading-normal">
                                    {searchQuery
                                        ? "Try adjusting your search query."
                                        : "Create your first Content Profile to start generating tailored ideas."}
                                </p>
                            </div>
                            {!searchQuery && (
                                <Button
                                    onClick={openCreateDialog}
                                    className="flex items-center justify-center gap-2 bg-primary text-gray-800 hover:bg-primary/90"
                                >
                                    <PlusCircle className="h-5 w-5" />
                                    <span>Create New Profile</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProfiles.map((profile) => (
                            <ProfileCard
                                key={profile.id}
                                profile={profile}
                                onEdit={openEditDialog}
                                onDelete={handleDeleteProfile}
                                onSetActive={handleSetActiveProfile}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Form Dialog */}
            <ProfileFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                profile={selectedProfile}
                mode={dialogMode}
                onSave={dialogMode === "create" ? handleCreateProfile : handleEditProfile}
            />
        </div>
    );
}
