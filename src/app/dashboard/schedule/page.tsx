'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  List,
  LayoutGrid,
  Bell,
  BellOff,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { ScheduledPostCard } from '@/components/ScheduledPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  saveReminder,
  removeReminder,
  hasReminder,
  getReminders,
} from '@/components/providers/ReminderProvider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string;
  content_blocks: Array<{ content: string; type: string }>;
  channel: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

type ViewMode = 'list' | 'calendar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500',
  x: 'bg-gray-800 dark:bg-gray-200',
  twitter: 'bg-sky-400',
  blog: 'bg-orange-500',
  facebook: 'bg-blue-700',
  instagram: 'bg-pink-500',
};

const getChannelLabel = (channel: string) => {
  const map: Record<string, string> = {
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    blog: 'Blog',
    twitter: 'Twitter',
    facebook: 'Facebook',
    instagram: 'Instagram',
  };
  return map[channel] ?? channel;
};

const getContentPreview = (post: ScheduledPost) =>
  Array.isArray(post.content_blocks) && post.content_blocks.length > 0
    ? post.content_blocks[0].content || 'No content'
    : 'No content';

// ─── Calendar Month View ───────────────────────────────────────────────────────

function MonthCalendarView({
  posts,
  onScheduleOnDay,
}: {
  posts: ScheduledPost[];
  onScheduleOnDay: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // index posts by day for fast lookup
  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    posts.forEach((post) => {
      const key = format(new Date(post.scheduled_time), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), post]);
    });
    return map;
  }, [posts]);

  // padding so the first day starts on the correct weekday (Sun=0)
  const leadingPad = getDay(startOfMonth(currentMonth));

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded-lg border border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="h-7 w-7 p-0 font-bold hover:bg-muted">
          ←
        </Button>
        <span className="text-sm font-bold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="h-7 w-7 p-0 font-bold hover:bg-muted">
          →
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading empty cells */}
        {Array.from({ length: leadingPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[72px] rounded-xl border border-transparent bg-muted/10" />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onScheduleOnDay(day)}
              className={`
                min-h-[72px] rounded-xl border p-2 text-left transition-all hover:bg-muted/50 hover:border-primary/50 shadow-2xs flex flex-col justify-between
                ${today ? 'border-primary bg-primary/10 ring-1 ring-primary/30 shadow-xs' : 'border-border bg-card'}
              `}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    today
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs'
                      : 'text-foreground/80'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-md border border-border">
                    {dayPosts.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1 w-full">
                {dayPosts.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs ${
                      CHANNEL_COLORS[post.channel] ?? 'bg-muted-foreground'
                    }`}
                    title={getContentPreview(post)}
                  >
                    {format(new Date(post.scheduled_time), 'h:mm a')} · {getChannelLabel(post.channel)}
                  </div>
                ))}
                {dayPosts.length > 2 && (
                  <div className="text-[10px] text-muted-foreground font-semibold pl-1">
                    +{dayPosts.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [reminderStates, setReminderStates] = useState<Record<string, boolean>>({});
  const [newPost, setNewPost] = useState({
    content: '',
    channel: 'linkedin',
    date: new Date(),
    time: '09:00',
    optimize_time: false,
    reminder: false,
  });
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  // Sync reminder states from localStorage whenever posts update
  useEffect(() => {
    const states: Record<string, boolean> = {};
    posts.forEach((p) => {
      states[p.id] = hasReminder(p.id);
    });
    setReminderStates(states);
  }, [posts]);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedule/index');
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  // ── Reminder toggle ───────────────────────────────────────────────────────────

  const toggleReminder = (post: ScheduledPost) => {
    const isOn = hasReminder(post.id);
    if (isOn) {
      removeReminder(post.id);
      setReminderStates((prev) => ({ ...prev, [post.id]: false }));
      toast('Reminder removed', { icon: '🔕' });
    } else {
      // Request permission if needed
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm !== 'granted') {
            toast.error('Please allow notifications in your browser to use reminders.');
            return;
          }
          saveReminder({
            id: post.id,
            content: getContentPreview(post),
            channel: post.channel,
            scheduled_time: post.scheduled_time,
          });
          setReminderStates((prev) => ({ ...prev, [post.id]: true }));
          toast.success('Reminder set! We\'ll notify you when it\'s time to post.', { icon: '🔔' });
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        saveReminder({
          id: post.id,
          content: getContentPreview(post),
          channel: post.channel,
          scheduled_time: post.scheduled_time,
        });
        setReminderStates((prev) => ({ ...prev, [post.id]: true }));
        toast.success('Reminder set! We\'ll notify you when it\'s time to post.', { icon: '🔔' });
      } else {
        toast.error('Notifications are blocked. Please enable them in your browser settings.');
      }
    }
  };

  // ── Schedule / Edit ──────────────────────────────────────────────────────────

  const openSchedulerOnDay = (date: Date) => {
    setSelectedDate(date);
    setShowScheduler(true);
  };

  const handleSchedulePost = async () => {
    if (!newPost.content.trim()) {
      toast.error('Please enter content for your post');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setScheduling(true);
    try {
      const [hours, minutes] = newPost.time.split(':').map(Number);
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const postData = {
        content_blocks: [{ content: newPost.content, type: 'paragraph' }],
        channel: newPost.channel,
        scheduled_time: scheduledTime.toISOString(),
        optimize_time: newPost.optimize_time,
      };

      let response;
      if (editingPost) {
        response = await fetch(`/api/schedule/update?id=${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingPost ? 'update' : 'schedule'} post`);
      }

      const savedPost = await response.json();
      toast.success(`Post ${editingPost ? 'updated' : 'scheduled'} successfully!`);

      // Auto-set reminder if the user toggled it on in the form
      if (newPost.reminder && savedPost?.id) {
        if ('Notification' in window && Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          saveReminder({
            id: savedPost.id,
            content: newPost.content,
            channel: newPost.channel,
            scheduled_time: scheduledTime.toISOString(),
          });
        }
      }

      // Reset form
      setNewPost({ content: '', channel: 'linkedin', date: new Date(), time: '09:00', optimize_time: false, reminder: false });
      setEditingPost(null);
      setShowScheduler(false);
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error(error instanceof Error ? error.message : `Failed to ${editingPost ? 'update' : 'schedule'} post`);
    } finally {
      setScheduling(false);
    }
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    const content = Array.isArray(post.content_blocks) && post.content_blocks.length > 0
      ? post.content_blocks.map((block) => block.content).join('\n\n')
      : '';
    const date = new Date(post.scheduled_time);
    setNewPost({
      content,
      channel: post.channel,
      date,
      time: format(date, 'HH:mm'),
      optimize_time: false,
      reminder: hasReminder(post.id),
    });
    setSelectedDate(date);
    setShowScheduler(true);
  };

  const deletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule/delete?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete post');
      removeReminder(id); // also clean up any reminder
      setReminderStates((prev) => { const s = { ...prev }; delete s[id]; return s; });
      toast.success('Post deleted successfully!');
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const suggestBestTime = () => {
    toast('AI time suggestions will be applied when you schedule the post');
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Card className="overflow-hidden py-4">
          <CardHeader className="px-4 pb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-7" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduledPosts = posts
    .filter((p) => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Schedule your content and track your publishing calendar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-muted p-0.5 shadow-2xs">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs font-semibold gap-1.5 data-[state=active]:shadow-2xs"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs font-semibold gap-1.5 data-[state=active]:shadow-2xs"
              onClick={() => setViewMode('calendar')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Calendar
            </Button>
          </div>

          <Button size="sm" onClick={() => { setSelectedDate(new Date()); setShowScheduler(true); }} className="font-semibold shadow-2xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* ── Scheduler Modal ─────────────────────────────────────────────────── */}
      {showScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="text-md font-bold text-foreground">
                {editingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => {
                  setShowScheduler(false);
                  setEditingPost(null);
                  setNewPost({ content: '', channel: 'linkedin', date: new Date(), time: '09:00', optimize_time: false, reminder: false });
                }}
              >
                <span className="text-lg">×</span>
              </Button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5">
              <div className="space-y-4">
                {/* Content */}
                <div>
                  <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5 block">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Enter your content..."
                    className="min-h-[110px] text-xs sm:text-sm border-border bg-background"
                  />
                </div>

                {/* Channel + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5 block">
                      Channel
                    </Label>
                    <Select
                      value={newPost.channel}
                      onValueChange={(v) => setNewPost({ ...newPost, channel: v })}
                    >
                      <SelectTrigger className="h-9 text-xs sm:text-sm border-border bg-background font-medium">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="x">X (Twitter)</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5 block">
                      Time
                    </Label>
                    <Input
                      type="time"
                      className="h-9 text-xs sm:text-sm border-border bg-background font-medium"
                      value={newPost.time}
                      onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Date picker + options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">
                      Date
                    </Label>
                    <div className="border border-border rounded-xl p-2 w-full bg-card shadow-2xs">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="w-full pointer-events-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* AI time optimisation */}
                    <div className="flex items-center space-x-2 bg-muted/40 p-2.5 rounded-xl border border-border">
                      <Switch
                        id="optimize_time"
                        checked={newPost.optimize_time}
                        onCheckedChange={(checked) => setNewPost({ ...newPost, optimize_time: checked })}
                      />
                      <Label htmlFor="optimize_time" className="text-xs font-semibold leading-tight text-foreground">
                        Use AI to optimise posting time
                      </Label>
                    </div>

                    {!newPost.optimize_time && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 font-medium border-border hover:bg-muted"
                        onClick={suggestBestTime}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Get AI Suggestion
                      </Button>
                    )}

                    {/* Reminder toggle */}
                    <div className="flex items-center space-x-2 bg-muted/40 p-2.5 rounded-xl border border-border">
                      <Switch
                        id="reminder"
                        checked={newPost.reminder}
                        onCheckedChange={(checked) => setNewPost({ ...newPost, reminder: checked })}
                      />
                      <Label htmlFor="reminder" className="text-xs font-semibold leading-tight text-foreground flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-primary" />
                        Remind me when it's time to post
                      </Label>
                    </div>

                    {newPost.reminder && (
                      <p className="text-[11px] text-muted-foreground px-1 font-medium leading-relaxed">
                        You'll get a browser notification at the scheduled time. Keep this tab open or add MuseFlow to your home screen.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <Button
                size="sm"
                className="w-full h-9 font-bold shadow-xs"
                onClick={handleSchedulePost}
                disabled={scheduling}
              >
                {scheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  editingPost ? 'Update Post' : 'Schedule Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <Card className="py-4 border border-border bg-card shadow-sm rounded-xl">
        <CardHeader className="px-5 pb-3 border-b border-border bg-muted/20">
          <CardTitle className="text-base font-bold text-foreground">
            {viewMode === 'list' ? 'Upcoming Posts' : format(new Date(), 'MMMM yyyy')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            {viewMode === 'list'
              ? 'Your scheduled content pieces — click the bell to set a reminder'
              : 'Click any day to schedule a post on that date'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4">
          {/* ── List view ───────────────────────────────────────────────────── */}
          {viewMode === 'list' && (
            <div className="grid gap-3">
              {scheduledPosts.length > 0 ? (
                scheduledPosts.map((post) => (
                  <div key={post.id} className="relative">
                    <ScheduledPostCard
                      post={post}
                      onDelete={deletePost}
                      onEdit={handleEditPost}
                    />
                    {/* Reminder bell — overlaid bottom-right of the card */}
                    <button
                      onClick={() => toggleReminder(post)}
                      title={reminderStates[post.id] ? 'Remove reminder' : 'Set reminder'}
                      className={`
                        absolute bottom-3 right-[6.5rem] flex items-center gap-1 text-[11px] font-medium transition-colors
                        ${reminderStates[post.id]
                          ? 'text-orange-500 hover:text-orange-600'
                          : 'text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      {reminderStates[post.id]
                        ? <Bell className="h-3.5 w-3.5 fill-orange-500" />
                        : <BellOff className="h-3.5 w-3.5" />}
                      <span>{reminderStates[post.id] ? 'Reminder on' : 'Remind me'}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <div className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3">
                    <CalendarIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-md font-medium mb-1">No scheduled posts</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Schedule your first post to get started
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setShowScheduler(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Post
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Calendar view ─────────────────────────────────────────────── */}
          {viewMode === 'calendar' && (
            <MonthCalendarView
              posts={scheduledPosts}
              onScheduleOnDay={openSchedulerOnDay}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
