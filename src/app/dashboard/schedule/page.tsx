'use client';

import { useState } from 'react';
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
  Edit, 
  Trash2, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  channel: string;
  scheduledTime: Date;
  status: 'scheduled' | 'posted';
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      title: 'Weekly Tech Roundup',
      content: 'This week in tech: AI developments, new product launches, and industry insights.',
      channel: 'linkedin',
      scheduledTime: new Date(new Date().setHours(10, 0, 0, 0)),
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'New Feature Launch',
      content: 'We\'re excited to announce our new AI content generation feature!',
      channel: 'x',
      scheduledTime: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'scheduled'
    }
  ]);
  
  const [showScheduler, setShowScheduler] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    channel: 'linkedin',
    date: new Date(),
    time: '09:00'
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleSchedulePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Parse the selected date and time
    const [hours, minutes] = newPost.time.split(':').map(Number);
    const scheduledTime = new Date(selectedDate || new Date());
    scheduledTime.setHours(hours, minutes, 0, 0);

    const scheduledPost: ScheduledPost = {
      id: `post-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      channel: newPost.channel,
      scheduledTime,
      status: 'scheduled'
    };

    setPosts([...posts, scheduledPost]);
    setNewPost({
      title: '',
      content: '',
      channel: 'linkedin',
      date: new Date(),
      time: '09:00'
    });
    setShowScheduler(false);
  };

  const suggestBestTime = () => {
    // In a real implementation, this would use AI to suggest the best time
    // For now, we'll suggest a random time
    const hours = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
    const minutes = Math.random() > 0.5 ? 0 : 30;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    setNewPost(prev => ({
      ...prev,
      time: timeString
    }));
  };

  const deletePost = (id: string) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'linkedin': return 'linkedin';
      case 'x': return 'x';
      case 'blog': return 'file-text';
      default: return 'rss';
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'linkedin': return 'LinkedIn';
      case 'x': return 'X (Twitter)';
      case 'blog': return 'Blog';
      default: return channel;
    }
  };

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
              <span className="text-xl">X</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Enter post title..."
                />
              </div>
              
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
                  
                  <div>
                    <Label>Best Time Suggestion</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={suggestBestTime}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Suggestion
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSchedulePost}
              >
                Schedule Post
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
            Your scheduled content for the next week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {posts.length > 0 ? (
              posts
                .filter(post => post.status === 'scheduled')
                .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
                .map((post) => (
                  <div 
                    key={post.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors flex justify-between items-start"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{getChannelLabel(post.channel)}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {format(post.scheduledTime, 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(post.scheduledTime, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {}}>
                        <Edit className="h-4 w-4" />
                      </Button>
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

      {/* Past Posts */}
      {posts.some(post => post.status === 'posted') && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Posted</CardTitle>
            <CardDescription>
              Content you&apos;ve published recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {posts
                .filter(post => post.status === 'posted')
                .map((post) => (
                  <div 
                    key={post.id} 
                    className="border rounded-lg p-4 bg-muted/30 flex justify-between items-start"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{getChannelLabel(post.channel)}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {format(post.scheduledTime, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">Posted</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}