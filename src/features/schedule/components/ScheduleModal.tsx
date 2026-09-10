"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, Loader2, Bell } from "lucide-react";
import { ScheduledPost, NewPostFormState } from "../types";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost: ScheduledPost | null;
  newPost: NewPostFormState;
  setNewPost: React.Dispatch<React.SetStateAction<NewPostFormState>>;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  onSchedulePost: () => Promise<void>;
  scheduling: boolean;
  onSuggestBestTime: () => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  editingPost,
  newPost,
  setNewPost,
  selectedDate,
  setSelectedDate,
  onSchedulePost,
  scheduling,
  onSuggestBestTime,
}: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="text-md font-bold text-foreground">
            {editingPost ? "Edit Post" : "Schedule Post"}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onClose}
          >
            <span className="text-lg">×</span>
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="space-y-4">
            {/* Content */}
            <div>
              <Label
                htmlFor="content"
                className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5 block"
              >
                Content
              </Label>
              <Textarea
                id="content"
                value={newPost.content}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, content: e.target.value }))
                }
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
                  onValueChange={(v) =>
                    setNewPost((prev) => ({ ...prev, channel: v }))
                  }
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
                  onChange={(e) =>
                    setNewPost((prev) => ({ ...prev, time: e.target.value }))
                  }
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
                    onCheckedChange={(checked) =>
                      setNewPost((prev) => ({ ...prev, optimize_time: checked }))
                    }
                  />
                  <Label
                    htmlFor="optimize_time"
                    className="text-xs font-semibold leading-tight text-foreground"
                  >
                    Use AI to optimise posting time
                  </Label>
                </div>

                {!newPost.optimize_time && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 font-medium border-border hover:bg-muted"
                    onClick={onSuggestBestTime}
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
                    onCheckedChange={(checked) =>
                      setNewPost((prev) => ({ ...prev, reminder: checked }))
                    }
                  />
                  <Label
                    htmlFor="reminder"
                    className="text-xs font-semibold leading-tight text-foreground flex items-center gap-1.5"
                  >
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    Remind me when it&apos;s time to post
                  </Label>
                </div>

                {newPost.reminder && (
                  <p className="text-[11px] text-muted-foreground px-1 font-medium leading-relaxed">
                    You&apos;ll get a browser notification at the scheduled time. Keep this tab open or add MuseFlow to your home screen.
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
            onClick={onSchedulePost}
            disabled={scheduling}
          >
            {scheduling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : editingPost ? (
              "Update Post"
            ) : (
              "Schedule Post"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
