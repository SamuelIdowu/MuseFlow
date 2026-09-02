'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Sparkles,
  SquarePen,
  Megaphone,
  Calendar,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Plus,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  RecentIdeaItem,
  RecentCanvasItem,
  RecentCampaignItem,
  UpcomingPostItem,
} from '@/lib/dashboardServerActions';
import { cn } from '@/lib/utils';

interface RecentWorkTabsProps {
  recentIdeas: RecentIdeaItem[];
  recentCanvases: RecentCanvasItem[];
  recentCampaigns: RecentCampaignItem[];
  upcomingPosts: UpcomingPostItem[];
}

export function RecentWorkTabs({
  recentIdeas,
  recentCanvases,
  recentCampaigns,
  upcomingPosts,
}: RecentWorkTabsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDateSafely = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return dateStr;
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('x'))
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30';
    if (p.includes('linkedin'))
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
    if (p.includes('instagram'))
      return 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30';
    if (p.includes('blog') || p.includes('newsletter'))
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    return 'bg-muted text-foreground/80 border-border';
  };

  return (
    <Card className="border border-border bg-card shadow-sm flex flex-col overflow-hidden">
      <Tabs defaultValue="ideas" className="w-full flex flex-col flex-1">
        <CardHeader className="p-4 pb-3 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Recent Workspace Activity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Continue where you left off across ideation, canvas mapping, campaigns, and scheduling.
            </CardDescription>
          </div>

          <TabsList className="bg-muted/80 p-1 h-auto min-h-9 rounded-xl border border-border/80 flex flex-wrap sm:flex-nowrap items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <TabsTrigger
              value="ideas"
              className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Ideas ({recentIdeas.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="canvases"
              className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all rounded-lg"
            >
              <SquarePen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Canvases ({recentCanvases.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all rounded-lg"
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Campaigns ({recentCampaigns.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all rounded-lg"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Queue ({upcomingPosts.length})</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex-1">
          {/* TAB 1: IDEAS */}
          <TabsContent value="ideas" className="m-0 space-y-3 focus-visible:outline-none">
            {recentIdeas.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-xl border-border bg-muted/20">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-foreground">No ideas generated yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Spark hooks, blog outlines, or social content angles with your active brand persona.
                </p>
                <Link href="/dashboard/ideas">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Idea</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentIdeas.map((idea) => {
                  const firstKernel = idea.kernels && idea.kernels.length > 0 ? idea.kernels[0] : idea.topic;
                  const otherCount = idea.kernels ? Math.max(0, idea.kernels.length - 1) : 0;

                  return (
                    <div
                      key={idea.id}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold py-0 px-2 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 bg-indigo-500/10"
                            >
                              {idea.inputType}
                            </Badge>
                            {otherCount > 0 && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                +{otherCount} more angles
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                            {formatDateSafely(idea.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1.5" title={idea.topic}>
                          {idea.topic}
                        </h4>

                        <p className="text-xs text-foreground/80 line-clamp-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 leading-relaxed font-sans">
                          {firstKernel}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(firstKernel, idea.id)}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 hover:bg-muted font-medium"
                        >
                          {copiedId === idea.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/canvas?topic=${encodeURIComponent(idea.topic)}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-500/10 font-medium"
                            >
                              <SquarePen className="w-3 h-3" />
                              <span>Canvas</span>
                            </Button>
                          </Link>
                          <Link href="/dashboard/ideas">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 hover:bg-muted font-medium">
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recentIdeas.length > 0 && (
              <div className="pt-2 flex justify-end">
                <Link
                  href="/dashboard/ideas"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore all ideas in studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: CANVASES */}
          <TabsContent value="canvases" className="m-0 space-y-3 focus-visible:outline-none">
            {recentCanvases.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-xl border-border bg-muted/20">
                <SquarePen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-foreground">No canvas workspaces yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Visual node graphs help you expand one idea into a connected network of multi-channel formats.
                </p>
                <Link href="/dashboard/canvas">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Smart Canvas</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentCanvases.map((canvas) => (
                  <div
                    key={canvas.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-sky-500/50 hover:shadow-xs transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0 shadow-2xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {canvas.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Updated {formatDateSafely(canvas.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <Link href={`/dashboard/canvas?session=${canvas.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-sky-500/30 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {recentCanvases.length > 0 && (
              <div className="pt-2 flex justify-end">
                <Link
                  href="/dashboard/canvas"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open visual canvas editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: CAMPAIGNS */}
          <TabsContent value="campaigns" className="m-0 space-y-3 focus-visible:outline-none">
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-xl border-border bg-muted/20">
                <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-foreground">No saved campaigns yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Orchestrate synchronized multi-post campaigns across Twitter, LinkedIn, and newsletters.
                </p>
                <Link href="/dashboard/campaigns">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Launch Campaign Generator</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-xs transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold py-0 px-2', getPlatformBadgeColor(camp.platform))}
                        >
                          {camp.platform}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatDateSafely(camp.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1">
                        {camp.topic}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Tone: <span className="font-semibold text-foreground">{camp.tone}</span> · {camp.postCount} assets generated
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border flex justify-end">
                      <Link href="/dashboard/campaigns">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 hover:bg-emerald-500/10 font-medium"
                        >
                          <span>View Campaign</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentCampaigns.length > 0 && (
              <div className="pt-2 flex justify-end">
                <Link
                  href="/dashboard/campaigns"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Manage all campaigns</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: SCHEDULE */}
          <TabsContent value="schedule" className="m-0 space-y-3 focus-visible:outline-none">
            {upcomingPosts.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-xl border-border bg-muted/20">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-foreground">No posts scheduled</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Plan your weekly publishing cadence across all your distribution channels.
                </p>
                <Link href="/dashboard/schedule">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Calendar & Queue</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 hover:border-amber-500/50 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-semibold py-0.5 px-2 flex-shrink-0', getPlatformBadgeColor(post.channel))}
                      >
                        {post.channel}
                      </Badge>

                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {post.previewContent || 'Scheduled content update'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {formatScheduledDate(post.scheduledTime)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold capitalize px-2 py-0.5 h-5 flex-shrink-0 bg-muted text-foreground border border-border"
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {upcomingPosts.length > 0 && (
              <div className="pt-2 flex justify-end">
                <Link
                  href="/dashboard/schedule"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open calendar schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
