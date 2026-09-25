"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  getUserCanvasSessionsAction,
  createCanvasSessionAction,
  updateCanvasSessionNameAction,
} from "@/features/canvas/actions/canvasActions";

export interface CanvasSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useCanvasSessions(initialTitle?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam =
    searchParams.get("session") ||
    searchParams.get("id") ||
    searchParams.get("canvasId");

  const [internalActiveId, setInternalActiveId] = useState<string | undefined>(
    sessionParam || undefined
  );
  const [prevSessionParam, setPrevSessionParam] = useState(sessionParam);

  if (sessionParam !== prevSessionParam) {
    setPrevSessionParam(sessionParam);
    if (sessionParam) {
      setInternalActiveId(sessionParam);
    }
  }

  const activeCanvasId = sessionParam || internalActiveId;
  const setActiveCanvasId = setInternalActiveId;

  const [canvasSessions, setCanvasSessions] = useState<CanvasSession[]>([]);
  const [pageTitle, setPageTitle] = useState(
    initialTitle ||
      searchParams.get("title") ||
      searchParams.get("topic") ||
      "My New Article"
  );
  const titleDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadCanvasSessions = useCallback(async () => {
    try {
      const sessions = await getUserCanvasSessionsAction();
      setCanvasSessions(sessions);
    } catch (err) {
      console.error("Error loading canvas sessions:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getUserCanvasSessionsAction()
      .then((sessions) => {
        if (isMounted) setCanvasSessions(sessions);
      })
      .catch((err) => {
        console.error("Error loading canvas sessions:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setPageTitle(newTitle);
    if (titleDebounceTimer.current) {
      clearTimeout(titleDebounceTimer.current);
    }
    if (activeCanvasId) {
      titleDebounceTimer.current = setTimeout(async () => {
        try {
          await updateCanvasSessionNameAction(activeCanvasId, newTitle);
          setCanvasSessions((prev) =>
            prev.map((s) =>
              s.id === activeCanvasId ? { ...s, name: newTitle } : s
            )
          );
        } catch (err) {
          console.error("Failed to update canvas title in database:", err);
        }
      }, 800);
    }
  };

  const handleCreateNewCanvas = async () => {
    try {
      const newSession = await createCanvasSessionAction("New Canvas");
      if (newSession?.id) {
        toast.success("Created new canvas");
        router.push(`/dashboard/canvas?session=${newSession.id}`);
        loadCanvasSessions();
      }
    } catch (err) {
      console.error("Failed to create new canvas:", err);
      toast.error("Could not create new canvas");
    }
  };

  const handleSwitchCanvas = (targetSessionId: string) => {
    if (targetSessionId === activeCanvasId) return;
    router.push(`/dashboard/canvas?session=${targetSessionId}`);
  };

  return {
    canvasSessions,
    activeCanvasId,
    setActiveCanvasId,
    pageTitle,
    setPageTitle,
    handleTitleChange,
    loadCanvasSessions,
    handleCreateNewCanvas,
    handleSwitchCanvas,
  };
}
