"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, List, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  saveReminder,
  removeReminder,
  hasReminder,
} from "@/components/providers/ReminderProvider";

import {
  ScheduledPost,
  ViewMode,
  NewPostFormState,
  getContentPreview,
} from "@/features/schedule/types";
import { MonthCalendarView } from "@/features/schedule/components/MonthCalendarView";
import { ScheduleModal } from "@/features/schedule/components/ScheduleModal";
import { ScheduleListView } from "@/features/schedule/components/ScheduleListView";
import { ScheduleSkeleton } from "@/features/schedule/components/ScheduleSkeleton";

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [reminderStates, setReminderStates] = useState<Record<string, boolean>>({});
  const [newPost, setNewPost] = useState<NewPostFormState>({
    content: "",
    channel: "linkedin",
    date: new Date(),
    time: "09:00",
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
      const response = await fetch("/api/schedule");
      if (!response.ok) {
        // Fallback to legacy index endpoint if needed
        const legacyRes = await fetch("/api/schedule/index");
        if (!legacyRes.ok) throw new Error("Failed to fetch scheduled posts");
        const data = await legacyRes.json();
        setPosts(data);
        return;
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      toast.error("Failed to load scheduled posts");
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
      toast("Reminder removed", { icon: "🔕" });
    } else {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm !== "granted") {
            toast.error("Please allow notifications in your browser to use reminders.");
            return;
          }
          saveReminder({
            id: post.id,
            content: getContentPreview(post),
            channel: post.channel,
            scheduled_time: post.scheduled_time,
          });
          setReminderStates((prev) => ({ ...prev, [post.id]: true }));
          toast.success("Reminder set! We'll notify you when it's time to post.", { icon: "🔔" });
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        saveReminder({
          id: post.id,
          content: getContentPreview(post),
          channel: post.channel,
          scheduled_time: post.scheduled_time,
        });
        setReminderStates((prev) => ({ ...prev, [post.id]: true }));
        toast.success("Reminder set! We'll notify you when it's time to post.", { icon: "🔔" });
      } else {
        toast.error("Notifications are blocked. Please enable them in your browser settings.");
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
      toast.error("Please enter content for your post");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setScheduling(true);
    try {
      const [hours, minutes] = newPost.time.split(":").map(Number);
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const postData = {
        content_blocks: [{ content: newPost.content, type: "paragraph" }],
        channel: newPost.channel,
        scheduled_time: scheduledTime.toISOString(),
        optimize_time: newPost.optimize_time,
      };

      let response: Response;
      if (editingPost) {
        response = await fetch(`/api/schedule/${editingPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
        if (!response.ok) {
          // Fallback to legacy endpoint
          response = await fetch(`/api/schedule/update?id=${editingPost.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          });
        }
      } else {
        response = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingPost ? "update" : "schedule"} post`);
      }

      const savedPost = await response.json();
      toast.success(`Post ${editingPost ? "updated" : "scheduled"} successfully!`);

      if (newPost.reminder && savedPost?.id) {
        if ("Notification" in window && Notification.permission !== "granted") {
          await Notification.requestPermission();
        }
        if ("Notification" in window && Notification.permission === "granted") {
          saveReminder({
            id: savedPost.id,
            content: newPost.content,
            channel: newPost.channel,
            scheduled_time: scheduledTime.toISOString(),
          });
        }
      }

      setNewPost({
        content: "",
        channel: "linkedin",
        date: new Date(),
        time: "09:00",
        optimize_time: false,
        reminder: false,
      });
      setEditingPost(null);
      setShowScheduler(false);
      fetchScheduledPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error(error instanceof Error ? error.message : `Failed to ${editingPost ? "update" : "schedule"} post`);
    } finally {
      setScheduling(false);
    }
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    const content = Array.isArray(post.content_blocks) && post.content_blocks.length > 0
      ? post.content_blocks.map((block) => block.content).join("\n\n")
      : "";
    const date = new Date(post.scheduled_time);
    setNewPost({
      content,
      channel: post.channel,
      date,
      time: format(date, "HH:mm"),
      optimize_time: false,
      reminder: hasReminder(post.id),
    });
    setSelectedDate(date);
    setShowScheduler(true);
  };

  const deletePost = async (id: string) => {
    try {
      let response = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!response.ok) {
        response = await fetch(`/api/schedule/delete?id=${id}`, { method: "DELETE" });
      }
      if (!response.ok) throw new Error("Failed to delete post");
      removeReminder(id);
      setReminderStates((prev) => {
        const s = { ...prev };
        delete s[id];
        return s;
      });
      toast.success("Post deleted successfully!");
      fetchScheduledPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const suggestBestTime = () => {
    toast("AI time suggestions will be applied when you schedule the post");
  };

  if (loading) {
    return <ScheduleSkeleton />;
  }

  const scheduledPosts = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Manage your publishing schedule and queued posts across all channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-muted p-1 shadow-2xs">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs font-semibold gap-1.5 data-[state=active]:shadow-2xs"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs font-semibold gap-1.5 data-[state=active]:shadow-2xs"
              onClick={() => setViewMode("calendar")}
            >
              <LayoutGrid className="h-4 w-4" />
              Calendar
            </Button>
          </div>

          <Button
            size="lg"
            onClick={() => {
              setSelectedDate(new Date());
              setShowScheduler(true);
            }}
            className="font-semibold shadow-2xs"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* ── Scheduler Modal ─────────────────────────────────────────────────── */}
      <ScheduleModal
        isOpen={showScheduler}
        onClose={() => {
          setShowScheduler(false);
          setEditingPost(null);
          setNewPost({
            content: "",
            channel: "linkedin",
            date: new Date(),
            time: "09:00",
            optimize_time: false,
            reminder: false,
          });
        }}
        editingPost={editingPost}
        newPost={newPost}
        setNewPost={setNewPost}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onSchedulePost={handleSchedulePost}
        scheduling={scheduling}
        onSuggestBestTime={suggestBestTime}
      />

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <Card className="py-4 border border-border bg-card shadow-sm rounded-xl">
        <CardHeader className="px-5 pb-3 border-b border-border bg-muted/20">
          <CardTitle className="text-base font-bold text-foreground">
            {viewMode === "list" ? "Upcoming Posts" : format(new Date(), "MMMM yyyy")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            {viewMode === "list"
              ? "Your scheduled content pieces — click the bell to set a reminder"
              : "Click any day to schedule a post on that date"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4">
          {viewMode === "list" ? (
            <ScheduleListView
              posts={scheduledPosts}
              reminderStates={reminderStates}
              onDeletePost={deletePost}
              onEditPost={handleEditPost}
              onToggleReminder={toggleReminder}
              onOpenScheduler={() => setShowScheduler(true)}
            />
          ) : (
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
