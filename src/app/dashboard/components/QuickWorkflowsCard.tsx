'use client';

import Link from 'next/link';
import { ArrowRight, SquarePen, Megaphone, FileEdit, Sparkles, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function QuickWorkflowsCard() {
  const workflows = [
    {
      title: 'Repurpose Content',
      description: 'Convert long-form text into multi-platform posts and threads.',
      icon: Sparkles,
      href: '/dashboard/ideas?template=repurpose',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: 'Popular',
    },
    {
      title: 'Visual Mind Mapping',
      description: 'Expand content ideas into visual node networks on canvas.',
      icon: SquarePen,
      href: '/dashboard/canvas',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
      badge: 'Visual',
    },
    {
      title: 'Multi-Post Campaign',
      description: 'Generate coordinated posts across X, LinkedIn, and newsletter.',
      icon: Megaphone,
      href: '/dashboard/campaigns',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Multi-Channel',
    },
    {
      title: 'Draft in Studio',
      description: 'Write, format, and refine long-form content with AI.',
      icon: FileEdit,
      href: '/dashboard/editor',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: 'Editor',
    },
  ];

  return (
    <Card className="border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground">
              Production Workflows
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Recommended content pipelines & shortcuts
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2.5 justify-center">
        {workflows.map((wf) => {
          const Icon = wf.icon;
          return (
            <Link
              key={wf.title}
              href={wf.href}
              className="group p-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/50 hover:shadow-2xs transition-all flex items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 overflow-hidden">
                <div className={cn('p-2 rounded-lg border flex-shrink-0 mt-0.5 shadow-2xs', wf.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {wf.title}
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-foreground/80 font-semibold uppercase border border-border">
                      {wf.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 mt-0.5">
                    {wf.description}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1.5" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
