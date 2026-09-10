"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  ScheduledPost,
  CHANNEL_COLORS,
  getChannelLabel,
  getContentPreview,
} from "../types";

interface MonthCalendarViewProps {
  posts: ScheduledPost[];
  onScheduleOnDay: (date: Date) => void;
}

export function MonthCalendarView({
  posts,
  onScheduleOnDay,
}: MonthCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    posts.forEach((post) => {
      const key = format(new Date(post.scheduled_time), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), post]);
    });
    return map;
  }, [posts]);

  const leadingPad = getDay(startOfMonth(currentMonth));

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded-lg border border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="h-7 w-7 p-0 font-bold hover:bg-muted"
        >
          ←
        </Button>
        <span className="text-sm font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="h-7 w-7 p-0 font-bold hover:bg-muted"
        >
          →
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading empty cells */}
        {Array.from({ length: leadingPad }).map((_, i) => (
          <div
            key={`pad-${i}`}
            className="min-h-[72px] rounded-xl border border-transparent bg-muted/10"
          />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onScheduleOnDay(day)}
              className={`
                min-h-[72px] rounded-xl border p-2 text-left transition-all hover:bg-muted/50 hover:border-primary/50 shadow-2xs flex flex-col justify-between
                ${
                  today
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-xs"
                    : "border-border bg-card"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    today
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs"
                      : "text-foreground/80"
                  }`}
                >
                  {format(day, "d")}
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
                      CHANNEL_COLORS[post.channel] ?? "bg-muted-foreground"
                    }`}
                    title={getContentPreview(post)}
                  >
                    {format(new Date(post.scheduled_time), "h:mm a")} ·{" "}
                    {getChannelLabel(post.channel)}
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
