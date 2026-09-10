"use client";

import React from "react";
import { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Layers,
  ChevronDown,
  Plus,
  Check,
  PlusCircle,
  SquarePen,
  Save,
  Download,
  FileCode,
  FileText,
  Maximize,
  Minimize,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface CanvasHeaderProps {
  pageTitle: string;
  onTitleChange: (val: string) => void;
  activeProfile: Profile | null;
  canvasSessions: { id: string; name: string; created_at: string; updated_at: string }[];
  activeCanvasId?: string;
  onSwitchCanvas: (id: string) => void;
  onCreateNewCanvas: () => void;
  onAddBlock: () => void;
  onLoadLatestDashboardChat: () => void;
  onSaveCanvasToIdeas: () => void;
  onExport: (format: "markdown" | "text") => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClearCanvas: () => void;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function CanvasHeader({
  pageTitle,
  onTitleChange,
  activeProfile,
  canvasSessions,
  activeCanvasId,
  onSwitchCanvas,
  onCreateNewCanvas,
  onAddBlock,
  onLoadLatestDashboardChat,
  onSaveCanvasToIdeas,
  onExport,
  isFullscreen,
  onToggleFullscreen,
  onClearCanvas,
  canvasContainerRef,
}: CanvasHeaderProps) {
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 md:p-4 rounded-xl border border-border shadow-xs">
        {/* Left: Canvas Sessions Selector & Title */}
        <div className="flex flex-col min-w-0 w-full sm:w-auto flex-1 mr-0 sm:mr-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold gap-1 shrink-0 bg-muted/40 hover:bg-muted"
                  title="Switch or manage Canvas Sessions"
                >
                  <Layers className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">Canvases</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-1.5 shadow-xl z-50">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    My Canvases
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold gap-1 hover:bg-sky-500/10"
                    onClick={onCreateNewCanvas}
                  >
                    <Plus className="h-3 w-3" /> New
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {canvasSessions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No other canvases found
                    </div>
                  ) : (
                    canvasSessions.map((session) => (
                      <DropdownMenuItem
                        key={session.id}
                        onClick={() => onSwitchCanvas(session.id)}
                        className={cn(
                          "text-xs flex items-center justify-between p-2 rounded-md cursor-pointer group transition-colors",
                          session.id === activeCanvasId
                            ? "bg-sky-500/10 font-semibold text-sky-700 dark:text-sky-300"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate">{session.name || "Untitled Canvas"}</span>
                        </div>
                        {session.id === activeCanvasId && (
                          <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              className="text-base sm:text-xl md:text-2xl font-bold bg-transparent border-none focus-visible:ring-0 w-full min-w-0 font-space-grotesk h-auto py-0 px-0 text-foreground placeholder:text-muted-foreground truncate"
              type="text"
              value={pageTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled Canvas"
            />
          </div>
          {activeProfile && (
            <span className="text-[11px] md:text-xs text-muted-foreground truncate mt-0.5 ml-0.5">
              Active Profile:{" "}
              <span className="font-medium text-foreground/80">
                {activeProfile.profile_name}
              </span>
            </span>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* New Canvas Button */}
            <Button
              onClick={onCreateNewCanvas}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-medium gap-1 text-foreground hover:bg-muted"
              title="Create a new blank canvas"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">New Canvas</span>
            </Button>

            {/* Primary Action: Add Block */}
            <Button
              onClick={onAddBlock}
              size="sm"
              className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-xs font-medium"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Block
            </Button>

            {/* Import Latest AI Chat */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium gap-1.5 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40"
              onClick={onLoadLatestDashboardChat}
              title="Import latest draft or brainstorm from Dashboard AI Chat"
            >
              <SquarePen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Import Chat</span>
            </Button>

            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
              onClick={onSaveCanvasToIdeas}
            >
              <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Save to Ideas</span>
              <span className="sm:hidden">Save</span>
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 z-50">
                <DropdownMenuItem
                  onClick={() => onExport("markdown")}
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  <FileCode className="mr-2 h-4 w-4 text-orange-600" /> Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExport("text")}
                  className="text-xs sm:text-sm cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 text-blue-600" /> Plain Text (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Secondary utility actions */}
          <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0 border-l pl-1.5 sm:pl-2 border-border/60">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Clear Canvas"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="max-w-sm mx-4 z-50"
                container={isFullscreen ? canvasContainerRef.current : undefined}
              >
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-base">
                      Clear Canvas?
                    </AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="text-sm leading-relaxed">
                    This will permanently delete all content blocks and connections on your canvas. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2 flex-row gap-2 justify-end">
                  <AlertDialogCancel className="h-9 text-sm mt-0">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onClearCanvas}
                  >
                    Clear Canvas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
