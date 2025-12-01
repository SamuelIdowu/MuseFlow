/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import toast from "react-hot-toast";

interface ToneConfig {
  professionalism: number;
  creativity: number;
  casualness: number;
  directness: number;
}

interface Profile {
  id: string;
  userId: string;
  niche: string;
  tone_config: ToneConfig;
  samples: string[];
}

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile>({
    id: "",
    userId: "",
    niche: "",
    tone_config: {
      professionalism: 50,
      creativity: 50,
      casualness: 50,
      directness: 50,
    },
    samples: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (!clerkUser) {
        toast.error("User not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      // Get Supabase user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        toast.error("Failed to retrieve user session.");
        setLoading(false);
        return;
      }

      const userId = userData.id;

      // Fetch the profile from the database
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          userId,
          niche: data.niche || "",
          tone_config: (data.tone_config as unknown as ToneConfig) || {
            professionalism: 50,
            creativity: 50,
            casualness: 50,
            directness: 50,
          },
          samples: (data.samples as string[]) || [],
        });
      } else {
        // If no profile exists yet, create with default values
        setProfile({
          id: "",
          userId,
          niche: "",
          tone_config: {
            professionalism: 50,
            creativity: 50,
            casualness: 50,
            directness: 50,
          },
          samples: [],
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [supabase, clerkUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToneChange = (toneType: keyof ToneConfig, value: number[]) => {
    setProfile((prev) => ({
      ...prev,
      tone_config: {
        ...prev.tone_config,
        [toneType]: value[0],
      },
    }));
  };

  const handleAddSample = () => {
    setProfile((prev) => ({
      ...prev,
      samples: [...prev.samples, ""],
    }));
  };

  const handleSampleChange = (index: number, value: string) => {
    setProfile((prev) => {
      const newSamples = [...prev.samples];
      newSamples[index] = value;
      return {
        ...prev,
        samples: newSamples,
      };
    });
  };

  const handleRemoveSample = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index),
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (!clerkUser) {
        toast.error("User not authenticated");
        setSaving(false);
        return;
      }

      // Get Supabase user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        toast.error("Failed to retrieve user session.");
        setSaving(false);
        return;
      }

      const userId = userData.id;

      const profileToUpsert = {
        user_id: userId,
        niche: profile.niche,
        tone_config: profile.tone_config as unknown as any, // Type assertion for JSON compatibility
        samples: profile.samples as unknown as any,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(
          profile.id ? { ...profileToUpsert, id: profile.id } : profileToUpsert,
          { onConflict: "user_id" }
        );

      if (error) {
        throw error;
      }

      toast.success("Profile saved successfully!");
    } catch (error: unknown) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Profile Management
        </h2>
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Your Niche</CardTitle>
              <CardDescription>
                Define your content creation niche.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., AI in Marketing, Web Development Tutorials"
                value={profile.niche}
                onChange={(e) => handleInputChange("niche", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Tone & Voice Configuration</CardTitle>
              <CardDescription>
                Adjust sliders to define your content&apos;s tone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Professionalism</Label>
                <Slider
                  defaultValue={[profile.tone_config.professionalism]}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    handleToneChange("professionalism", value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Creativity</Label>
                <Slider
                  defaultValue={[profile.tone_config.creativity]}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    handleToneChange("creativity", value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Casualness</Label>
                <Slider
                  defaultValue={[profile.tone_config.casualness]}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    handleToneChange("casualness", value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Directness</Label>
                <Slider
                  defaultValue={[profile.tone_config.directness]}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    handleToneChange("directness", value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Content Samples</CardTitle>
              <CardDescription>
                Provide sample content for better AI generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.samples.map((sample, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Textarea
                    placeholder="Enter a content sample..."
                    value={sample}
                    onChange={(e) => handleSampleChange(index, e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveSample(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button onClick={handleAddSample} className="w-full">
                Add Sample
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
