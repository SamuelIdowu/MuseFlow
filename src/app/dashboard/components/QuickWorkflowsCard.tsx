'use client';

import Link from 'next/link';
import { ArrowRight, FileText, SquarePen, Megaphone, FileEdit, Sparkles, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function QuickWorkflowsCard() {
  const workflows = [
    {
      title: 'Repurpose Long-Form Content',
      description: 'Turn 1 blog, article, or video script into 5 Twitter posts & 1 LinkedIn breakdown.',
      icon: Sparkles,
      href: '/dashboard/ideas?template=repurpose',
      color: 'text-indigo-500',
      badge: 'Popular',
    },
    {
      title: 'Visual Node Brainstorming',
      description: 'Break complex topics into expandable visual nodes on the interactive canvas.',
      icon: SquarePen,
      href: '/dashboard/canvas',
      color: 'text-sky-500',
      badge: 'Visual',
    },
    {
      title: 'Coordinated Campaign Launcher',
      description: 'Generate multi-phase launch or awareness campaigns across multiple channels simultaneously.',
      icon: Megaphone,
      href: '/dashboard/campaigns',
      color: 'text-emerald-500',
      badge: 'Multi-Channel',
    },
    {
      title: 'AI Drafting Studio with Copilot',
      description: 'Draft, polish, and format long-form content with our live TipTap AI sidekick.',
      icon: FileEdit,
      href: '/dashboard/editor',
      color: 'text-purple-500',
      badge: 'Editor',
    },
  ];

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Production Workflows
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Recommended content pipelines & shortcuts
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 flex-1 flex flex-col gap-2 justify-center">
        {workflows.map((wf) => {
          const Icon = wf.icon;
          return (
            <Link
              key={wf.title}
              href={wf.href}
              className="group p-2.5 rounded-lg border border-border/50 bg-background/60 hover:bg-accent/40 hover:border-primary/30 transition-all flex items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 overflow-hidden">
                <div className={cn('p-1.5 rounded-md bg-muted/80 flex-shrink-0 mt-0.5', wf.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {wf.title}
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium uppercase">
                      {wf.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {wf.description}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
