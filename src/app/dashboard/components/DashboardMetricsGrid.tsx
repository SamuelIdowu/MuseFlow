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
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      bgGlow: 'from-indigo-500/10 to-transparent',
      borderColor: 'hover:border-indigo-500/50',
    },
    {
      title: 'Visual Canvases',
      value: stats.canvasCount,
      label: 'Active Workspaces',
      icon: SquarePen,
      href: '/dashboard/canvas',
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      bgGlow: 'from-sky-500/10 to-transparent',
      borderColor: 'hover:border-sky-500/50',
    },
    {
      title: 'Saved Campaigns',
      value: stats.campaignsCount,
      label: 'Multi-Channel Sets',
      icon: Megaphone,
      href: '/dashboard/campaigns',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'hover:border-emerald-500/50',
    },
    {
      title: 'Scheduled Posts',
      value: stats.scheduledCount,
      label: 'Queued for Publishing',
      icon: Calendar,
      href: '/dashboard/schedule',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'hover:border-amber-500/50',
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
                'relative overflow-hidden transition-all duration-200 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-card',
                card.borderColor
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', card.bgGlow)} />
              <CardContent className="p-4 relative flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">{card.title}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center shadow-2xs', card.iconBg)}>
                      <Icon className={cn('w-3.5 h-3.5', card.iconColor)} />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
                    {card.value.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">{card.label}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {/* AI Allowance / Quota Card */}
      <Link href="/dashboard/settings/billing" className="group block focus:outline-none sm:col-span-2 lg:col-span-1">
        <Card className="relative overflow-hidden transition-all duration-200 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-card hover:border-purple-500/50 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50 pointer-events-none" />
          <CardContent className="p-4 relative flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg border border-purple-500/20 bg-purple-500/10 flex items-center justify-center shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-purple-500/20" />
                </div>
                <span className="text-xs font-semibold text-foreground/80">AI Quota</span>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 h-4 bg-muted text-foreground border border-border">
                {usage.plan}
              </Badge>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-lg font-bold tracking-tight text-foreground font-mono">
                  {usage.current} <span className="text-xs font-normal text-muted-foreground">/ {usage.limit}</span>
                </span>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  {usage.percentage}% used
                </span>
              </div>
              <Progress value={usage.percentage} className="h-1.5 bg-muted border border-border/40" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
