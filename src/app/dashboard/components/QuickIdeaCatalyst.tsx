'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, SquarePen, ArrowRight, Lightbulb, Compass, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PRESET_CHANNELS = [
  { id: 'all', label: 'All Angles' },
  { id: 'linkedin', label: 'LinkedIn Hook' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'script', label: 'Video Script' },
];

const SUGGESTION_CHIPS = [
  'How to scale SaaS to $10k MRR without ads',
  '3 uncommon mistakes senior engineers make',
  'The shift from reactive to proactive AI pair programming',
  'Why product positioning beats feature velocity',
];

export function QuickIdeaCatalyst() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLaunchIdeas = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    const query = new URLSearchParams({
      seed: topic.trim(),
      format: selectedFormat,
    });
    router.push(`/dashboard/ideas?${query.toString()}`);
  };

  const handleLaunchCanvas = () => {
    if (!topic.trim()) {
      router.push('/dashboard/canvas');
      return;
    }
    const query = new URLSearchParams({
      topic: topic.trim(),
    });
    router.push(`/dashboard/canvas?${query.toString()}`);
  };

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card/90 to-primary/5 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <CardContent className="p-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                Instant Content Catalyst
                <Badge variant="outline" className="text-[10px] font-normal py-0 text-primary border-primary/30">
                  Fast Generator
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Drop any topic, raw thought, or trend to instantly spark hooks, outlines, or visual maps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {PRESET_CHANNELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedFormat(item.id)}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-md font-medium transition-all',
                  selectedFormat === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLaunchIdeas} className="relative flex items-center mt-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What would you like to create or explore today? (e.g. 5 lessons from building an AI agent...)"
            className="pr-40 h-11 bg-background/80 border-border/80 text-sm focus-visible:ring-primary shadow-inner"
          />

          <div className="absolute right-1.5 flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLaunchCanvas}
              disabled={isSubmitting}
              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1"
              title="Open directly in visual node canvas"
            >
              <SquarePen className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!topic.trim() || isSubmitting}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span>Spark Ideas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
          </span>
          {SUGGESTION_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTopic(chip)}
              className="text-[11px] text-muted-foreground hover:text-foreground bg-background/60 hover:bg-accent px-2 py-0.5 rounded border border-border/50 transition-colors truncate max-w-[260px]"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
