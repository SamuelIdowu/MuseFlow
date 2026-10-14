"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Bell, BellOff } from "lucide-react";
import { ScheduledPostCard } from "@/components/ScheduledPostCard";
import { ScheduledPost } from "../types";

interface ScheduleListViewProps {
  posts: ScheduledPost[];
  reminderStates: Record<string, boolean>;
  onDeletePost: (id: string) => Promise<void>;
  onEditPost: (post: ScheduledPost) => void;
  onToggleReminder: (post: ScheduledPost) => void;
  onOpenScheduler: () => void;
}

export function ScheduleListView({
  posts,
  reminderStates,
  onDeletePost,
  onEditPost,
  onToggleReminder,
  onOpenScheduler,
}: ScheduleListViewProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-xl">
        <div className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3">
          <CalendarIcon className="h-full w-full" />
        </div>
        <h3 className="text-md font-medium mb-1">No scheduled posts</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Schedule your first post to get started
        </p>
        <Button size="sm" variant="outline" onClick={onOpenScheduler}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <ScheduledPostCard
            post={post}
            onDelete={onDeletePost}
            onEdit={onEditPost}
          />
          {/* Reminder bell — overlaid bottom-right of the card */}
          <button
            onClick={() => onToggleReminder(post)}
            title={reminderStates[post.id] ? "Remove reminder" : "Set reminder"}
            className={`
              absolute bottom-3 right-[6.5rem] flex items-center gap-1 text-[11px] font-medium transition-colors
              ${
                reminderStates[post.id]
                  ? "text-orange-500 hover:text-orange-600"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {reminderStates[post.id] ? (
              <Bell className="h-3.5 w-3.5 fill-orange-500" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            <span>{reminderStates[post.id] ? "Reminder on" : "Remind me"}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
