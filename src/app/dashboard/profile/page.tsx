'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    id: '',
    userId: '',
    niche: '',
    tone_config: {
      professionalism: 50,
      creativity: 50,
      casualness: 50,
      directness: 50
    },
    samples: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch the profile from the database
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          // If no profile exists yet, create with default values
          if (error.code === 'PGRST116') {
            setProfile({
              id: '',
              userId: session.user.id,
              niche: '',
              tone_config: {
                professionalism: 50,
                creativity: 50,
                casualness: 50,
                directness: 50
              },
              samples: [],
            });
          } else {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
          }
        } else {
          // Use the fetched profile data
          setProfile({
            id: data.id,
            userId: session.user.id,
            niche: data.niche || '',
            tone_config: data.tone_config || {
              professionalism: 50,
              creativity: 50,
              casualness: 50,
              directness: 50
            },
            samples: data.samples || [],
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToneChange = (toneType: string, value: number[]) => {
    setProfile(prev => ({
      ...prev,
      tone_config: {
        ...prev.tone_config,
        [toneType]: value[0]
      }
    }));
  };

  const handleAddSample = () => {
    setProfile(prev => ({
      ...prev,
      samples: [...prev.samples, '']
    }));
  };

  const handleSampleChange = (index: number, value: string) => {
    const newSamples = [...profile.samples];
    newSamples[index] = value;
    setProfile(prev => ({
      ...prev,
      samples: newSamples
    }));
  };

  const handleRemoveSample = (index: number) => {
    const newSamples = profile.samples.filter((_, i) => i !== index);
    setProfile(prev => ({
      ...prev,
      samples: newSamples
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            niche: profile.niche,
            tone_config: profile.tone_config,
            samples: profile.samples,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert([{
            user_id: session.user.id,
            niche: profile.niche,
            tone_config: profile.tone_config,
            samples: profile.samples
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Customize your profile and content preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Tell us about your niche and content preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="niche">Niche</Label>
            <Input
              id="niche"
              value={profile.niche}
              onChange={(e) => handleInputChange('niche', e.target.value)}
              placeholder="e.g., Technology, Marketing, Health & Fitness"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Content Tone Preferences</Label>
              <p className="text-sm text-muted-foreground mb-4">Adjust these sliders to match your preferred content tone</p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Professionalism</Label>
                  <span className="text-sm text-muted-foreground">{profile.tone_config.professionalism}%</span>
                </div>
                <Slider
                  value={[profile.tone_config.professionalism]}
                  onValueChange={(value) => handleToneChange('professionalism', value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Creativity</Label>
                  <span className="text-sm text-muted-foreground">{profile.tone_config.creativity}%</span>
                </div>
                <Slider
                  value={[profile.tone_config.creativity]}
                  onValueChange={(value) => handleToneChange('creativity', value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Casualness</Label>
                  <span className="text-sm text-muted-foreground">{profile.tone_config.casualness}%</span>
                </div>
                <Slider
                  value={[profile.tone_config.casualness]}
                  onValueChange={(value) => handleToneChange('casualness', value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Directness</Label>
                  <span className="text-sm text-muted-foreground">{profile.tone_config.directness}%</span>
                </div>
                <Slider
                  value={[profile.tone_config.directness]}
                  onValueChange={(value) => handleToneChange('directness', value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label>Your Content Samples</Label>
                <p className="text-sm text-muted-foreground">Paste examples of your content to help train your AI assistant</p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddSample}>
                Add Sample
              </Button>
            </div>

            {profile.samples.map((sample, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <Label>Sample {index + 1}</Label>
                  {profile.samples.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveSample(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Textarea
                  value={sample}
                  onChange={(e) => handleSampleChange(index, e.target.value)}
                  placeholder="Paste your content sample here..."
                  className="min-h-[100px]"
                />
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}