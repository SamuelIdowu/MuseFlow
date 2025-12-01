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
        <Card className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <CardContent className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-background rounded-xl border p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule New Post</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowScheduler(false)}
              >
                <span className="text-xl">×</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Enter your content..."
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label>Channel</Label>
                <Select value={newPost.channel} onValueChange={(value) => setNewPost({...newPost, channel: value})}>
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
                      onChange={(e) => setNewPost({...newPost, time: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id="optimize_time"
                      checked={newPost.optimize_time}
                      onChange={(e) => setNewPost({...newPost, optimize_time: e.target.checked})}
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
          </CardContent>
        </Card>
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
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex justify-between items-start"
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {Array.isArray(post.content_blocks) && post.content_blocks.length > 0
                          ? post.content_blocks[0].content || 'No content'
                          : 'No content'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{getChannelLabel(post.channel)}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(post.scheduled_time), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(post.scheduled_time), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
