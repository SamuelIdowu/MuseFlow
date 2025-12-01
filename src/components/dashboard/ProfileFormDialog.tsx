/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { Profile, ToneConfig } from "@/types/profile";

interface ProfileFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: Profile | null;
    mode: "create" | "edit";
    onSave: (profileData: any) => Promise<void>;
}

export function ProfileFormDialog({
    open,
    onOpenChange,
    profile,
    mode,
    onSave,
}: ProfileFormDialogProps) {
    const [profileName, setProfileName] = useState("");
    const [niche, setNiche] = useState("");
    const [toneConfig, setToneConfig] = useState<ToneConfig>({
        professionalism: 50,
        creativity: 50,
        casualness: 50,
        directness: 50,
    });
    const [samples, setSamples] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Reset form when profile changes or dialog opens
    useEffect(() => {
        if (mode === "edit" && profile) {
            setProfileName(profile.profile_name || "");
            setNiche(profile.niche || "");
            setToneConfig(
                profile.tone_config || {
                    professionalism: 50,
                    creativity: 50,
                    casualness: 50,
                    directness: 50,
                }
            );
            setSamples(profile.samples || []);
        } else if (mode === "create") {
            setProfileName("");
            setNiche("");
            setToneConfig({
                professionalism: 50,
                creativity: 50,
                casualness: 50,
                directness: 50,
            });
            setSamples([]);
        }
    }, [mode, profile, open]);

    const handleToneChange = (key: keyof ToneConfig, value: number[]) => {
        setToneConfig((prev) => ({ ...prev, [key]: value[0] }));
    };

    const handleAddSample = () => {
        setSamples((prev) => [...prev, ""]);
    };

    const handleSampleChange = (index: number, value: string) => {
        setSamples((prev) => {
            const newSamples = [...prev];
            newSamples[index] = value;
            return newSamples;
        });
    };

    const handleRemoveSample = (index: number) => {
        setSamples((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!profileName.trim()) {
            alert("Profile name is required");
            return;
        }

        setSaving(true);
        try {
            await onSave({
                profile_name: profileName.trim(),
                niche: niche.trim() || null,
                tone_config: toneConfig,
                samples: samples.filter((s) => s.trim() !== ""),
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create New Profile" : "Edit Profile"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Define a new content profile to guide AI generation."
                            : "Update your content profile settings."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Profile Name */}
                    <div className="space-y-2">
                        <Label htmlFor="profile-name">Profile Name *</Label>
                        <Input
                            id="profile-name"
                            placeholder="e.g., Tech Startup Blog"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                        />
                    </div>

                    {/* Niche */}
                    <div className="space-y-2">
                        <Label htmlFor="niche">Niche</Label>
                        <Input
                            id="niche"
                            placeholder="e.g., B2B SaaS, Sustainability, Finance"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                        />
                    </div>

                    {/* Tone Configuration */}
                    <div className="space-y-4">
                        <Label>Tone & Voice Configuration</Label>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Professionalism</span>
                                <span className="text-muted-foreground">{toneConfig.professionalism}</span>
                            </div>
                            <Slider
                                value={[toneConfig.professionalism]}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleToneChange("professionalism", value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Creativity</span>
                                <span className="text-muted-foreground">{toneConfig.creativity}</span>
                            </div>
                            <Slider
                                value={[toneConfig.creativity]}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleToneChange("creativity", value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Casualness</span>
                                <span className="text-muted-foreground">{toneConfig.casualness}</span>
                            </div>
                            <Slider
                                value={[toneConfig.casualness]}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleToneChange("casualness", value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Directness</span>
                                <span className="text-muted-foreground">{toneConfig.directness}</span>
                            </div>
                            <Slider
                                value={[toneConfig.directness]}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleToneChange("directness", value)}
                            />
                        </div>
                    </div>

                    {/* Content Samples */}
                    <div className="space-y-4">
                        <Label>Content Samples</Label>
                        <p className="text-sm text-muted-foreground">
                            Provide sample content for better AI generation.
                        </p>

                        {samples.map((sample, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <Textarea
                                    placeholder="Enter a content sample..."
                                    value={sample}
                                    onChange={(e) => handleSampleChange(index, e.target.value)}
                                    className="flex-grow"
                                    rows={3}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSample(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddSample}
                            className="w-full"
                        >
                            Add Sample
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : mode === "create" ? "Create Profile" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
