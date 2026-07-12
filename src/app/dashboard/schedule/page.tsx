'use client';

import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { ScheduledPostCard } from '@/components/ScheduledPostCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduledPost {
  id: string;
  content_blocks: Array<{ content: string; type: string }>;
  channel: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    channel: 'linkedin',
    date: new Date(),
    time: '09:00',
    optimize_time: false
  });
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch scheduled posts on component mount
  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedule/index');
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
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
      // Parse the selected date and time
      const [hours, minutes] = newPost.time.split(':').map(Number);
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const postData = {
        content_blocks: [{ content: newPost.content, type: 'paragraph' }],
        channel: newPost.channel,
        scheduled_time: scheduledTime.toISOString(),
        optimize_time: newPost.optimize_time
      };

      let response;
      if (editingPost) {
        response = await fetch(`/api/schedule/update?id=${editingPost.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingPost ? 'update' : 'schedule'} post`);
      }

      await response.json();
      toast.success(`Post ${editingPost ? 'updated' : 'scheduled'} successfully!`);

      // Reset form and refresh posts
      setNewPost({
        content: '',
        channel: 'linkedin',
        date: new Date(),
        time: '09:00',
        optimize_time: false
      });
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

    // Parse content from blocks or use default
    const content = Array.isArray(post.content_blocks) && post.content_blocks.length > 0
      ? post.content_blocks.map(block => block.content).join('\n\n')
      : '';

    // Parse date and time
    const date = new Date(post.scheduled_time);
    const timeStr = format(date, 'HH:mm');

    setNewPost({
      content,
      channel: post.channel,
      date: date,
      time: timeStr,
      optimize_time: false
    });
    setSelectedDate(date);
    setShowScheduler(true);
  };

  const suggestBestTime = () => {
    // This will be handled by the API with AI optimization
    toast('AI time suggestions will be applied when you schedule the post');
  };

  const deletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule/delete?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted successfully!');
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'linkedin': return 'LinkedIn';
      case 'x': return 'X (Twitter)';
      case 'blog': return 'Blog';
      case 'twitter': return 'Twitter';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      default: return channel;
    }
  };

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Schedule your content and track your publishing calendar
          </p>
        </div>
        <Button size="sm" onClick={() => setShowScheduler(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-background rounded-xl border shadow-lg flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-md font-semibold">{editingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setShowScheduler(false);
                  setEditingPost(null);
                  setNewPost({
                    content: '',
                    channel: 'linkedin',
                    date: new Date(),
                    time: '09:00',
                    optimize_time: false
                  });
                }}
              >
                <span className="text-lg">×</span>
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Content</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Enter your content..."
                    className="min-h-[100px] text-[13px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Channel</Label>
                    <Select value={newPost.channel} onValueChange={(value) => setNewPost({ ...newPost, channel: value })}>
                      <SelectTrigger className="h-8 text-[13px]">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="x">X (Twitter)</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Time</Label>
                    <Input
                      type="time"
                      className="h-8 text-[13px]"
                      value={newPost.time}
                      onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Date</Label>
                    <div className="border rounded-lg p-1.5 w-full bg-muted/20">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="w-full pointer-events-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border">
                      <Switch
                        id="optimize_time"
                        checked={newPost.optimize_time}
                        onCheckedChange={(checked) => setNewPost({ ...newPost, optimize_time: checked })}
                      />
                      <Label htmlFor="optimize_time" className="text-[12px] leading-tight">Use AI to optimize posting time</Label>
                    </div>

                    {!newPost.optimize_time && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-[12px] h-8"
                        onClick={suggestBestTime}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />
                        Get AI Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Action Button */}
            <div className="p-4 border-t">
              <Button
                size="sm"
                className="w-full h-8"
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

      {/* Calendar View */}
      <Card className="py-4">
        <CardHeader className="px-4 pb-2">
          <CardTitle className="text-lg">Upcoming Posts</CardTitle>
          <CardDescription className="text-[13px]">
            Your scheduled content pieces
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid gap-3">
            {posts.length > 0 ? (
              posts
                .filter((post: ScheduledPost) => post.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                .map((post) => (
                  <ScheduledPostCard
                    key={post.id}
                    post={post}
                    onDelete={deletePost}
                    onEdit={handleEditPost}
                  />
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
        </CardContent>
      </Card>
    </div>
  );
}
