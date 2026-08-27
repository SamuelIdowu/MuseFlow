'use client';

import Link from 'next/link';
import { User, Sliders, ExternalLink, Plus, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/profile';

interface BrandVoiceRadarCardProps {
  profile: Profile | null;
}

export function BrandVoiceRadarCard({ profile }: BrandVoiceRadarCardProps) {
  if (!profile) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col justify-between">
        <CardHeader className="p-4 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Brand Voice Persona
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                No active brand profile selected
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-center text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Set up your tone of voice, target audience, and style samples to ensure all AI outputs sound authentically like you.
          </p>
          <Link href="/dashboard/profiles" className="w-full">
            <Button size="sm" className="w-full text-xs gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Brand Profile</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Parse tone configuration safely
  const tone = profile.tone_config || {
    professionalism: 70,
    creativity: 80,
    casualness: 40,
    directness: 85,
  };

  const sampleCount = profile.samples ? (Array.isArray(profile.samples) ? profile.samples.length : 1) : 0;

  const toneMetrics = [
    { label: 'Professionalism', value: tone.professionalism ?? 50, color: 'bg-blue-500' },
    { label: 'Creativity', value: tone.creativity ?? 50, color: 'bg-purple-500' },
    { label: 'Casualness', value: tone.casualness ?? 50, color: 'bg-emerald-500' },
    { label: 'Directness', value: tone.directness ?? 50, color: 'bg-amber-500' },
  ];

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
                {profile.profile_name}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0">
                Active
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground truncate">
              {profile.niche ? `Niche: ${profile.niche}` : 'General Content Profile'}
            </CardDescription>
          </div>
        </div>

        <Link href="/dashboard/profiles">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Sliders className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Tone sliders / meters */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Voice Calibration</span>
            <span className="text-[10px]">{sampleCount} samples indexed</span>
          </div>

          {toneMetrics.map((meter) => (
            <div key={meter.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{meter.label}</span>
                <span className="font-mono font-medium text-foreground text-[10px]">{meter.value}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${meter.color}`}
                  style={{ width: `${meter.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Synced to all generators
          </span>
          <Link href="/dashboard/profiles">
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary gap-1">
              <span>Manage</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
