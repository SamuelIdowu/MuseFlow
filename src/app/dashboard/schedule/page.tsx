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
import { toast } from 'react-hot-toast';
import { ScheduledPostCard } from '@/components/ScheduledPostCard';

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

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule post');
      }

      const scheduledPost = await response.json();
      toast.success('Post scheduled successfully!');

      // Reset form and refresh posts
      setNewPost({
        content: '',
        channel: 'linkedin',
        date: new Date(),
        time: '09:00',
        optimize_time: false
      });
      setShowScheduler(false);
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule post');
    } finally {
      setScheduling(false);
    }
  };

  const suggestBestTime = () => {
    // This will be handled by the API with AI optimization
    toast('AI time suggestions will be applied when you schedule the post');
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;

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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your scheduled posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-muted-foreground">
            Schedule your content and track your publishing calendar
          </p>
        </div>
        <Button onClick={() => setShowScheduler(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-background rounded-xl border shadow-lg flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">Schedule New Post</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowScheduler(false)}
              >
                <span className="text-xl">×</span>
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 pt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Enter your content..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label>Channel</Label>
                  <Select value={newPost.channel} onValueChange={(value) => setNewPost({ ...newPost, channel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="x">X (Twitter)</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <div className="border rounded-lg p-2 w-full">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newPost.time}
                        onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        id="optimize_time"
                        checked={newPost.optimize_time}
                        onChange={(e) => setNewPost({ ...newPost, optimize_time: e.target.checked })}
                      />
                      <Label htmlFor="optimize_time">Use AI to optimize posting time</Label>
                    </div>

                    {!newPost.optimize_time && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={suggestBestTime}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Action Button */}
            <div className="p-6 pt-4 border-t">
              <Button
                className="w-full"
                onClick={handleSchedulePost}
                disabled={scheduling}
              >
                {scheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>
            Your scheduled content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {posts.length > 0 ? (
              posts
                .filter((post: ScheduledPost) => post.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                .map((post) => (
                  <ScheduledPostCard
                    key={post.id}
                    post={post}
                    onDelete={deletePost}
                  />
                ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                  <CalendarIcon className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium mb-1">No scheduled posts</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule your first post to get started
                </p>
                <Button onClick={() => setShowScheduler(true)}>
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
