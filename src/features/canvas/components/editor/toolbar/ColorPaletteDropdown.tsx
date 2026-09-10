"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import { ChevronDown, Palette, Check, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TEXT_COLOR_PALETTES, HIGHLIGHT_COLORS } from "./toolbarConstants";

interface ColorPaletteDropdownProps {
  editor: Editor;
}

export function ColorPaletteDropdown({ editor }: ColorPaletteDropdownProps) {
  const [currentColor, setCurrentColor] = useState("");
  const [currentHighlight, setCurrentHighlight] = useState("");
  const [customHex, setCustomHex] = useState("#ea580c");
  const [customHighlightHex, setCustomHighlightHex] = useState("#fef08a");

  const handleApplyCustomTextColor = (hex: string) => {
    if (!hex) return;
    let formatted = hex.trim();
    if (!formatted.startsWith("#")) formatted = `#${formatted}`;
    setCurrentColor(formatted);
    (editor.chain().focus() as any).setColor(formatted).run();
  };

  const handleApplyCustomHighlight = (hex: string) => {
    if (!hex) return;
    let formatted = hex.trim();
    if (!formatted.startsWith("#")) formatted = `#${formatted}`;
    const colorWithAlpha = formatted.length === 7 ? `${formatted}99` : formatted;
    setCurrentHighlight(colorWithAlpha);
    (editor.chain().focus() as any).setHighlight(colorWithAlpha).run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 transition-colors"
          title="Text & Highlight Color"
        >
          <div
            className="w-3.5 h-3.5 rounded-xs border border-border/80 shadow-2xs"
            style={{ backgroundColor: currentColor || "currentColor" }}
          />
          <ChevronDown size={11} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72 bg-card border-border shadow-2xl p-3 z-50 space-y-3 max-h-[500px] overflow-y-auto"
      >
        {/* TEXT COLOR SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Text Color
            </span>
            {currentColor && (
              <button
                type="button"
                onClick={() => {
                  setCurrentColor("");
                  (editor.chain().focus() as any).unsetColor().run();
                }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                Reset Default
              </button>
            )}
          </div>

          {/* Interactive Color Gradient Bar */}
          <div className="relative h-7 rounded-lg overflow-hidden border border-border/80 shadow-xs bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-sky-400 via-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center cursor-pointer group mb-2.5">
            <input
              type="color"
              value={customHex}
              onChange={(e) => {
                setCustomHex(e.target.value);
                handleApplyCustomTextColor(e.target.value);
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              title="Click gradient to pick any color"
            />
            <span className="text-[10px] font-semibold text-white drop-shadow-md pointer-events-none flex items-center gap-1 tracking-tight">
              <Palette size={11} className="drop-shadow-xs" />
              Pick from gradient spectrum
            </span>
          </div>

          {/* Custom Hex Input Row */}
          <div className="flex items-center gap-1.5 mb-3">
            <div
              className="w-6 h-6 rounded-md border border-border shadow-2xs shrink-0 transition-colors"
              style={{ backgroundColor: customHex }}
            />
            <div className="relative flex-1">
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyCustomTextColor(customHex);
                  }
                }}
                placeholder="#ea580c"
                className="w-full text-[11px] font-mono px-2 py-1 rounded-md border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleApplyCustomTextColor(customHex)}
              className="h-6 px-2 text-[10px] shrink-0"
            >
              Apply
            </Button>
          </div>

          {/* Curated Color Palettes */}
          <div className="space-y-2">
            {TEXT_COLOR_PALETTES.map((group) => (
              <div key={group.category}>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 block mb-1">
                  {group.category}
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {group.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCurrentColor(c.value);
                        if (c.value) {
                          (editor.chain().focus() as any).setColor(c.value).run();
                        } else {
                          (editor.chain().focus() as any).unsetColor().run();
                        }
                      }}
                      className="w-full h-6 rounded-md border border-border/70 flex items-center justify-center hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.value || "var(--foreground)" }}
                      title={c.name}
                    >
                      {currentColor === c.value && (
                        <Check size={11} className="text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* HIGHLIGHT COLOR SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Highlight Color
            </span>
            {currentHighlight && (
              <button
                type="button"
                onClick={() => {
                  setCurrentHighlight("");
                  (editor.chain().focus() as any).unsetHighlight().run();
                }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                Clear Highlight
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {HIGHLIGHT_COLORS.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => {
                  setCurrentHighlight(h.value);
                  if (h.value) {
                    (editor.chain().focus() as any).setHighlight(h.value).run();
                  } else {
                    (editor.chain().focus() as any).unsetHighlight().run();
                  }
                }}
                className="h-6 px-1 rounded-md border border-border/70 text-[10px] font-medium flex items-center justify-center hover:opacity-80 transition-opacity truncate"
                style={{ backgroundColor: h.value || "transparent" }}
                title={h.name}
              >
                {h.name}
              </button>
            ))}
          </div>

          <div className="relative h-6 rounded-md overflow-hidden border border-border/70 bg-gradient-to-r from-yellow-200 via-green-200 via-blue-200 via-pink-200 to-amber-200 flex items-center justify-center cursor-pointer">
            <input
              type="color"
              value={customHighlightHex}
              onChange={(e) => {
                setCustomHighlightHex(e.target.value);
                handleApplyCustomHighlight(e.target.value);
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              title="Pick custom highlight color"
            />
            <span className="text-[9.5px] font-medium text-gray-800 pointer-events-none flex items-center gap-1">
              <Sparkles size={10} />
              Custom Highlight Tone
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
