'use client';

import Link from 'next/link';
import { User, Sliders, ExternalLink, Plus, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/profile';

interface BrandVoiceRadarCardProps {
  profile: Profile | null;
}

export function BrandVoiceRadarCard({ profile }: BrandVoiceRadarCardProps) {
  if (!profile) {
    return (
      <Card className="border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Brand Voice Persona
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                No active brand profile selected
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 flex-1 flex flex-col justify-center text-center">
          <p className="text-xs text-foreground/80 mb-4 leading-relaxed font-medium">
            Set up your tone of voice, target audience, and style samples to ensure all AI outputs sound authentically like you.
          </p>
          <Link href="/dashboard/profiles" className="w-full">
            <Button size="sm" className="w-full text-xs gap-1.5 shadow-sm font-semibold">
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
    { label: 'Professionalism', value: tone.professionalism ?? 50, color: 'bg-blue-600 dark:bg-blue-400' },
    { label: 'Creativity', value: tone.creativity ?? 50, color: 'bg-purple-600 dark:bg-purple-400' },
    { label: 'Casualness', value: tone.casualness ?? 50, color: 'bg-emerald-600 dark:bg-emerald-400' },
    { label: 'Directness', value: tone.directness ?? 50, color: 'bg-amber-600 dark:bg-amber-400' },
  ];

  return (
    <Card className="border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-bold tracking-tight text-foreground truncate">
                {profile.profile_name}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0">
                Active
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground truncate font-medium">
              {profile.niche ? `Niche: ${profile.niche}` : 'General Content Profile'}
            </CardDescription>
          </div>
        </div>

        <Link href="/dashboard/profiles">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted">
            <Sliders className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        {/* Tone sliders / meters */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>Voice Calibration</span>
            <span className="text-[10px] font-medium text-foreground">{sampleCount} samples indexed</span>
          </div>

          {toneMetrics.map((meter) => (
            <div key={meter.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-foreground/80 font-medium">{meter.label}</span>
                <span className="font-mono font-bold text-foreground text-[10px]">{meter.value}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className={`h-full rounded-full transition-all ${meter.color}`}
                  style={{ width: `${meter.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Synced to all generators
          </span>
          <Link href="/dashboard/profiles">
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary font-semibold hover:bg-primary/10 gap-1">
              <span>Manage</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
