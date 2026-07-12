/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { ProfileFormDialog } from "@/components/dashboard/ProfileFormDialog";
import toast from "react-hot-toast";
import { Search, PlusCircle, Archive, Trash2 } from "lucide-react";
import { Profile } from "@/types/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProfilesManagementPage() {
    const { user: clerkUser } = useUser();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

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

    const handleDeleteProfile = (profileId: string) => {
        setProfileToDelete(profileId);
    };

    const handleConfirmDeleteProfile = async () => {
        if (!profileToDelete) return;
        const profileId = profileToDelete;
        setProfileToDelete(null);

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
            <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <Skeleton className="h-10 w-40" />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="overflow-hidden py-4">
                                <CardHeader className="flex flex-row items-center gap-3 px-4 pb-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-10" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Page Heading */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-3xl font-bold leading-tight tracking-tight">
                            Content Profiles
                        </h1>
                        <p className="text-muted-foreground text-sm font-normal leading-normal">
                            Manage your brand identities. The active profile will guide the AI
                            in generating new content.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={openCreateDialog}
                        className="flex items-center justify-center gap-2"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create New Profile</span>
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            className="w-full h-10 pl-12"
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
                            <div className="text-muted-foreground/20">
                                <Archive className="h-24 w-24" strokeWidth={1} />
                            </div>
                            <div className="flex max-w-md flex-col items-center gap-2 text-center">
                                <p className="text-lg font-bold leading-tight tracking-tight">
                                    {searchQuery
                                        ? "No profiles found"
                                        : "No profiles yet"}
                                </p>
                                <p className="text-muted-foreground text-sm font-normal leading-normal">
                                    {searchQuery
                                        ? "Try adjusting your search query."
                                        : "Create your first Content Profile to start generating tailored ideas."}
                                </p>
                            </div>
                            {!searchQuery && (
                                <Button
                                    onClick={openCreateDialog}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="h-4 w-4" />
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle className="text-base">Delete Content Profile?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm leading-relaxed">
                            Are you sure you want to delete this brand identity profile? This action will permanently delete it and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-2">
                        <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleConfirmDeleteProfile}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
