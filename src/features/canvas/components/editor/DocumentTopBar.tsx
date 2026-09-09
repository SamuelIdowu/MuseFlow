"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Share2,
  Sparkles,
  Calendar,
  PanelLeft,
  PanelRight,
  MoreHorizontal,
  FileDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

interface DocumentTopBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  wordCount: number;
  charCount: number;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  onExport: (format: "markdown" | "html" | "text") => void;
  onCopyContent: () => void;
  onLoadRecentChat?: () => void;
}

export function DocumentTopBar({
  title,
  onTitleChange,
  wordCount,
  charCount,
  isSaving = false,
  lastSavedAt,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  onExport,
  onCopyContent,
  onLoadRecentChat,
}: DocumentTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [copied, setCopied] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  const handleCopy = () => {
    onCopyContent();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <header className="h-14 border-b border-border/80 bg-card/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* Left section: Back + Sidebar Toggle + Breadcrumb Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLeftSidebar}
          className={`h-8 w-8 rounded-lg transition-colors hidden md:flex ${
            isLeftSidebarOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Creator Companion"
        >
          <PanelLeft size={16} />
        </Button>

        <div className="h-4 w-px bg-border/80 hidden sm:block" />

        {/* Title & Autosave status */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setTempTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xs sm:text-sm font-semibold bg-muted/50 border border-primary/40 rounded px-1.5 py-0.5 text-foreground outline-none w-48 sm:w-64"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[140px] sm:max-w-[260px] text-left"
                title="Click to rename"
              >
                {title || "Untitled Document"}
              </button>
            )}

            {/* Autosave status indicator */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
              {isSaving ? (
                <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle section: Word Count & Stats */}
      <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/30 border border-border/50">
        <span>
          <strong className="font-semibold text-foreground font-mono">{wordCount}</strong> words
        </span>
        <span className="text-border">|</span>
        <span>
          <strong className="font-semibold text-foreground font-mono">{charCount}</strong> chars
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <Clock size={11} className="text-muted-foreground" />
          <span>{readingTime}m read</span>
        </span>
      </div>

      {/* Right section: Unified Actions & AI Copilot */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Copy shortcut on wide screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hidden lg:flex items-center gap-1.5"
          title="Quick copy to clipboard"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>

        {/* Unified Document Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Share2 size={13} />
              <span>Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 text-xs">
            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? "Copied to Clipboard" : "Copy Content"}</span>
            </DropdownMenuItem>

            {onLoadRecentChat && (
              <DropdownMenuItem
                onClick={onLoadRecentChat}
                className="cursor-pointer gap-2 text-amber-600 dark:text-amber-400 focus:text-amber-600 dark:focus:text-amber-400"
              >
                <Sparkles size={14} className="text-amber-500 fill-amber-500/20" />
                <span>Import Latest AI Draft</span>
              </DropdownMenuItem>
            )}

            <Link href="/dashboard/schedule" className="w-full">
              <DropdownMenuItem className="cursor-pointer gap-2">
                <Calendar size={14} className="text-primary" />
                <span>Schedule Post...</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Export As
            </div>

            <DropdownMenuItem onClick={() => onExport("markdown")} className="cursor-pointer gap-2">
              <FileDown size={14} className="text-primary" />
              <span>Markdown (.md)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("html")} className="cursor-pointer gap-2">
              <FileDown size={14} className="text-blue-500" />
              <span>HTML Document (.html)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("text")} className="cursor-pointer gap-2">
              <FileDown size={14} className="text-emerald-500" />
              <span>Plain Text (.txt)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Copilot Toggle */}
        <Button
          size="sm"
          onClick={onToggleRightSidebar}
          className={`h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-all ${
            isRightSidebarOpen
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30"
          }`}
        >
          <Sparkles size={13} className="fill-current" />
          <span className="hidden sm:inline">AI Copilot</span>
          <PanelRight size={13} className="opacity-70 ml-0.5" />
        </Button>
      </div>
    </header>
  );
}
