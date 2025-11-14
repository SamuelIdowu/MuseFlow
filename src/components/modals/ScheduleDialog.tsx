'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ideaTitle: string;
  ideaDescription: string;
  ideaId?: string;
  onSchedule: (post: {
    title: string;
    content: string;
    channel: string;
    scheduledTime: string;
    optimizeTime: boolean;
    ideaId?: string;
  }) => void;
}

export function ScheduleDialog({ 
  isOpen, 
  onOpenChange, 
  ideaTitle, 
  ideaDescription,
  onSchedule 
}: ScheduleDialogProps) {
  const [newPost, setNewPost] = useState({
    title: ideaTitle,
    content: ideaDescription,
    channel: 'linkedin',
    date: new Date(),
    time: '09:00',
    optimizeTime: false
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleSchedulePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Parse the selected date and time
    const [hours, minutes] = newPost.time.split(':').map(Number);
    const scheduledTime = new Date(selectedDate || new Date());
    scheduledTime.setHours(hours, minutes, 0, 0);

    onSchedule({
      title: newPost.title,
      content: newPost.content,
      channel: newPost.channel,
      scheduledTime: scheduledTime.toISOString(),
      optimizeTime: newPost.optimizeTime,
      ideaId
    });

    // Reset form
    setNewPost({
      title: ideaTitle,
      content: ideaDescription,
      channel: 'linkedin',
      date: new Date(),
      time: '09:00',
      optimizeTime: false
    });
    setSelectedDate(new Date());
    onOpenChange(false);
  };

  const suggestBestTime = async () => {
    // In a real implementation, this would call the AI to suggest the best time
    // For now, we'll just show a toast and suggest a time
    toast.success('AI suggested optimal time!');
    
    // Generate a random time between 8am and 8pm for demo purposes
    const hours = Math.floor(Math.random() * 12) + 8;
    const minutes = Math.random() > 0.5 ? 0 : 30;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    setNewPost(prev => ({
      ...prev,
      time: timeString,
      optimizeTime: true
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Schedule Post from Idea</DialogTitle>
          <DialogDescription>
            Set the details for your scheduled post
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <div className="border rounded-lg p-2 w-full mt-1">
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedulePost}>
            Schedule Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}