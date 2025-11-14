/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      content_suggestions: true,
      schedule_reminders: true
    },
    content: {
      default_channel: 'linkedin',
      auto_save: true,
      ai_tone: 'balanced'
    }
  });

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleContentChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would save settings to the database
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive important updates via email</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={() => handleNotificationChange('email')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time alerts on your device</p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={() => handleNotificationChange('push')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Content Suggestions</Label>
                <p className="text-sm text-muted-foreground">Get AI-generated content ideas</p>
              </div>
              <Switch
                checked={settings.notifications.content_suggestions}
                onCheckedChange={() => handleNotificationChange('content_suggestions')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Schedule Reminders</Label>
                <p className="text-sm text-muted-foreground">Reminders for scheduled posts</p>
              </div>
              <Switch
                checked={settings.notifications.schedule_reminders}
                onCheckedChange={() => handleNotificationChange('schedule_reminders')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
            <CardDescription>
              Customize your content creation experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Publishing Channel</Label>
              <Select 
                value={settings.content.default_channel} 
                onValueChange={(value) => handleContentChange('default_channel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="all">All Channels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Content</Label>
                <p className="text-sm text-muted-foreground">Automatically save content as you work</p>
              </div>
              <Switch
                checked={settings.content.auto_save}
                onCheckedChange={(checked) => handleContentChange('auto_save', checked)}
              />
            </div>
            
            <div>
              <Label>AI Tone Preference</Label>
              <Select 
                value={settings.content.ai_tone} 
                onValueChange={(value) => handleContentChange('ai_tone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}