"use client";

/**
 * ReminderProvider
 *
 * Runs silently in the background for the entire dashboard session.
 * Reads scheduled posts that have reminders enabled from localStorage,
 * and fires browser Notification API alerts when the time comes.
 *
 * No external service needed — works fully offline after the page is loaded.
 */

import { useEffect, useRef } from "react";

export const REMINDERS_KEY = "museflow_reminders";

export interface PostReminder {
  id: string;
  content: string;
  channel: string;
  scheduled_time: string; // ISO string
  fired?: boolean;
}

export function saveReminder(post: PostReminder) {
  const existing = getReminders();
  const updated = existing.filter((r) => r.id !== post.id); // dedupe
  updated.push({ ...post, fired: false });
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

export function removeReminder(postId: string) {
  const existing = getReminders();
  const updated = existing.filter((r) => r.id !== postId);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

export function getReminders(): PostReminder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function hasReminder(postId: string): boolean {
  return getReminders().some((r) => r.id === postId);
}

export function ReminderProvider() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Request notification permission on mount (only if not already granted)
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const reminders = getReminders();
      const now = Date.now();
      let changed = false;

      const updated = reminders.map((reminder) => {
        if (reminder.fired) return reminder;

        const postTime = new Date(reminder.scheduled_time).getTime();
        // Fire when within the current minute of the scheduled time
        const diffMs = postTime - now;

        if (diffMs <= 0 && diffMs > -60_000) {
          // Fire the notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const channelLabel =
              reminder.channel.charAt(0).toUpperCase() +
              reminder.channel.slice(1);
            new Notification(`⏰ Time to post on ${channelLabel}!`, {
              body: reminder.content.slice(0, 120) + (reminder.content.length > 120 ? "…" : ""),
              icon: "/logoo.png",
              tag: `museflow-reminder-${reminder.id}`,
            });
          }
          changed = true;
          return { ...reminder, fired: true };
        }

        return reminder;
      });

      if (changed) {
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      }
    };

    // Check every 30 seconds
    intervalRef.current = setInterval(checkReminders, 30_000);
    checkReminders(); // also run immediately on mount

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // This component renders nothing — it's a background worker
  return null;
}
