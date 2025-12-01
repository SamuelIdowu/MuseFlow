'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { apiCall } from '@/lib/apiClient';

import { Profile } from '@/types/profile';

interface DashboardClientProps {
  activeProfile: Profile | null;
}

export function DashboardClient({ activeProfile }: DashboardClientProps) {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleGenerateIdeas = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text or a link');
      return;
    }

    setIsLoading(true);
    try {
      await apiCall('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: inputText,
          input_type: 'text',
          active_profile: activeProfile,
        }),
      }, 'IDEAS_API');

      toast.success('Ideas generated successfully!');
      // Refresh the current page to show updated data
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandWithAI = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to expand');
      return;
    }

    setIsExpanding(true);
    try {
      const response = await fetch('/api/canvas/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block_content: inputText,
          block_type: 'paragraph',
          active_profile: activeProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to expand content');
      }

      const data = await response.json();
      setInputText(data.expanded_content);
      toast.success('Content expanded successfully!');
    } catch (error: any) {
      console.error('Error expanding content:', error);
      toast.error(error.message || 'Failed to expand content');
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Ideas</CardTitle>
        <CardDescription>
          Paste text or a link to generate content ideas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Active Context:</span>
              {activeProfile ? (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium border border-primary/20">
                  {activeProfile.profile_name}
                </span>
              ) : (
                <span className="text-muted-foreground italic">No profile selected</span>
              )}
            </div>

            {activeProfile && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {activeProfile.niche && (
                  <div className="flex gap-1">
                    <span className="font-medium">Niche:</span>
                    <span>{activeProfile.niche}</span>
                  </div>
                )}
                {activeProfile.tone_config && (
                  <div className="flex gap-1">
                    <span className="font-medium">Tone:</span>
                    <span>
                      Prof: {activeProfile.tone_config.professionalism}/10 •
                      Casual: {activeProfile.tone_config.casualness}/10
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Textarea
            placeholder={activeProfile
              ? `Generate content ideas for ${activeProfile.profile_name} (e.g., "LinkedIn posts about AI trends")...`
              : "Paste text or a link to generate content ideas..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[150px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleExpandWithAI}
              disabled={isExpanding || isLoading}
              variant="outline"
              className="flex-1"
            >
              {isExpanding ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Expanding...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Expand with AI
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateIdeas}
              disabled={isLoading || isExpanding}
              className="flex-1"
            >
              {isLoading ? 'Generating...' : 'Generate Ideas'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}