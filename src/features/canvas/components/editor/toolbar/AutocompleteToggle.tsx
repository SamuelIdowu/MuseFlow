"use client";

import React from "react";
import { Sparkles, Loader2, Bot } from "lucide-react";

interface AutocompleteToggleProps {
  isAutocompleteEnabled?: boolean;
  onToggleAutocomplete?: () => void;
  isGeneratingAutocomplete?: boolean;
  completionSource?: "research_agent" | "gemini_fallback" | null;
}

export function AutocompleteToggle({
  isAutocompleteEnabled = true,
  onToggleAutocomplete,
  isGeneratingAutocomplete = false,
  completionSource,
}: AutocompleteToggleProps) {
  if (!onToggleAutocomplete) return null;

  return (
    <>
      <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
      <button
        type="button"
        onClick={onToggleAutocomplete}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 select-none ${
          isAutocompleteEnabled
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 shadow-2xs"
            : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40 hover:text-foreground"
        }`}
        title={
          isAutocompleteEnabled
            ? "Inline AI Autocomplete is ON (Press Tab ⇥ to accept suggestions)"
            : "Inline AI Autocomplete is paused (Click to enable)"
        }
      >
        {isGeneratingAutocomplete ? (
          <Loader2 size={13} className="animate-spin text-amber-500" />
        ) : completionSource === "research_agent" ? (
          <Bot size={13} className="text-amber-500" />
        ) : (
          <Sparkles
            size={13}
            className={
              isAutocompleteEnabled
                ? "text-amber-500 fill-amber-500/20"
                : "text-muted-foreground"
            }
          />
        )}
        <span className="hidden md:inline text-[11px]">AI Autocomplete:</span>
        <span className="text-[11px] font-semibold">
          {isAutocompleteEnabled ? "ON" : "OFF"}
        </span>
        {isAutocompleteEnabled && (
          <span className="text-[9.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono hidden lg:inline">
            Tab ⇥
          </span>
        )}
      </button>
    </>
  );
}
