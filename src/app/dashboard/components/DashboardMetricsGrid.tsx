'use client';

import { Sparkles, SquarePen, Megaphone, Calendar, Zap, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UsageData } from '@/lib/dashboardServerActions';

interface DashboardMetricsGridProps {
  stats: {
    ideasCount: number;
    canvasCount: number;
    campaignsCount: number;
    scheduledCount: number;
    profileCount: number;
  };
  usage: UsageData;
}

export function DashboardMetricsGrid({ stats, usage }: DashboardMetricsGridProps) {
  const metricCards = [
    {
      title: 'Ideas Generated',
      value: stats.ideasCount,
      label: 'Angles & Hooks',
      icon: Sparkles,
      href: '/dashboard/ideas',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgGlow: 'from-indigo-500/10 to-transparent',
      borderColor: 'hover:border-indigo-500/40',
    },
    {
      title: 'Visual Canvases',
      value: stats.canvasCount,
      label: 'Active Workspaces',
      icon: SquarePen,
      href: '/dashboard/canvas',
      iconColor: 'text-sky-500 dark:text-sky-400',
      bgGlow: 'from-sky-500/10 to-transparent',
      borderColor: 'hover:border-sky-500/40',
    },
    {
      title: 'Saved Campaigns',
      value: stats.campaignsCount,
      label: 'Multi-Channel Sets',
      icon: Megaphone,
      href: '/dashboard/campaigns',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'hover:border-emerald-500/40',
    },
    {
      title: 'Scheduled Posts',
      value: stats.scheduledCount,
      label: 'Queued for Publishing',
      icon: Calendar,
      href: '/dashboard/schedule',
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'hover:border-amber-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {metricCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href} className="group block focus:outline-none">
            <Card
              className={cn(
                'relative overflow-hidden transition-all duration-200 border-border/60 hover:shadow-md hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm',
                card.borderColor
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', card.bgGlow)} />
              <CardContent className="p-4 relative flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                  <div className="flex items-center gap-1">
                    <Icon className={cn('w-4 h-4', card.iconColor)} />
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {card.value.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground/80">{card.label}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {/* AI Allowance / Quota Card */}
      <Link href="/dashboard/settings/billing" className="group block focus:outline-none sm:col-span-2 lg:col-span-1">
        <Card className="relative overflow-hidden transition-all duration-200 border-border/60 hover:shadow-md hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm hover:border-purple-500/40 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-60 pointer-events-none" />
          <CardContent className="p-4 relative flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400 fill-purple-500/20" />
                <span className="text-xs font-medium text-muted-foreground">AI Quota</span>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 h-4">
                {usage.plan}
              </Badge>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-lg font-bold tracking-tight text-foreground font-mono">
                  {usage.current} <span className="text-xs font-normal text-muted-foreground">/ {usage.limit}</span>
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  {usage.percentage}% used
                </span>
              </div>
              <Progress value={usage.percentage} className="h-1.5 bg-muted" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
