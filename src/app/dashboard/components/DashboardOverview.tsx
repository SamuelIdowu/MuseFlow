'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Sparkles,
  SquarePen,
  Megaphone,
  FileEdit,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardOverviewData } from '@/lib/dashboardServerActions';
import { HomeChatHub } from './HomeChatHub';
import { RecentWorkTabs } from './RecentWorkTabs';
import { BrandVoiceRadarCard } from './BrandVoiceRadarCard';
import { QuickWorkflowsCard } from './QuickWorkflowsCard';

interface DashboardOverviewProps {
  initialData: DashboardOverviewData;
}

export function DashboardOverview({ initialData }: DashboardOverviewProps) {
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.firstName || user?.username || 'Creator';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Top Greeting & Quick Navigation Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {getGreeting()}, {displayName} 👋
            </h1>
            {initialData.activeProfile && (
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground border-border/80 bg-muted/30"
              >
                Persona: <span className="font-semibold text-foreground ml-1">{initialData.activeProfile.profile_name}</span>
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Your conversational content engine. Brainstorm ideas, draft posts, and plan your schedule.
          </p>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/canvas">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent"
            >
              <SquarePen className="w-3.5 h-3.5 text-sky-500" />
              <span>Canvas</span>
            </Button>
          </Link>
          <Link href="/dashboard/editor">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent"
            >
              <FileEdit className="w-3.5 h-3.5 text-purple-500" />
              <span>Editor</span>
            </Button>
          </Link>
          <Link href="/dashboard/schedule">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Calendar</span>
            </Button>
          </Link>
          <Link href="/dashboard/ideas">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent hidden md:flex"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>All Ideas</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. Primary Conversational Creation Hub ─────────────────────────────── */}
      <HomeChatHub
        activeProfile={initialData.activeProfile}
        onPostScheduled={() => {
          // Soft refresh if needed
        }}
      />

      {/* ── 3. Workspace Activity Dock & Secondary Cards ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-2">
        {/* Left Column: Recent Work (Ideas, Canvas, Campaigns, Schedule) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <RecentWorkTabs
            recentIdeas={initialData.recentIdeas}
            recentCanvases={initialData.recentCanvases}
            recentCampaigns={initialData.recentCampaigns}
            upcomingPosts={initialData.upcomingPosts}
          />
        </div>

        {/* Right Column: Persona Radar & Workflow Guides */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <BrandVoiceRadarCard profile={initialData.activeProfile} />
          <QuickWorkflowsCard />
        </div>
      </div>
    </div>
  );
}
