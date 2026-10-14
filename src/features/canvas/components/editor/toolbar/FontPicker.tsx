"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { Type, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { FONT_FAMILIES, type FontFamilyOption } from "./toolbarConstants";

interface FontPickerProps {
  editor: Editor;
  currentFont: string;
  onFontChange?: (fontName: string, fontValue: string) => void;
  setInternalFont: (name: string) => void;
}

export function FontPicker({
  editor,
  currentFont,
  onFontChange,
  setInternalFont,
}: FontPickerProps) {
  const handleFontSelect = (font: FontFamilyOption) => {
    setInternalFont(font.name);
    onFontChange?.(font.name, font.value);
    (editor.chain().focus() as unknown as { setFontFamily: (f: string) => { run: () => boolean } })
      .setFontFamily(font.value)
      .run();
    toast.success(`Applied ${font.label} font`, { duration: 1500 });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 text-foreground font-medium transition-colors"
          title="Font Family"
        >
          <Type size={13} className="text-muted-foreground" />
          <span
            className="max-w-[90px] truncate text-xs"
            style={{
              fontFamily: FONT_FAMILIES.find((f) => f.name === currentFont)?.value,
            }}
          >
            {currentFont}
          </span>
          <ChevronDown size={11} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72 bg-card border-border shadow-xl p-1.5 z-50 max-h-[420px] overflow-y-auto"
      >
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Font Family
        </DropdownMenuLabel>
        {(["Sans-serif", "Serif", "Monospace", "System"] as const).map((category) => {
          const fonts = FONT_FAMILIES.filter((f) => f.category === category);
          if (!fonts.length) return null;
          return (
            <div key={category}>
              <div className="px-2 pt-2 pb-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {category}
                </span>
              </div>
              {fonts.map((font) => (
                <DropdownMenuItem
                  key={font.name}
                  onClick={() => handleFontSelect(font)}
                  className="flex items-start justify-between px-2 py-2 rounded-md cursor-pointer hover:bg-muted gap-2 group"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span
                      className="text-sm font-medium text-foreground leading-tight truncate"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </span>
                    <span
                      className="text-[11px] text-muted-foreground leading-snug truncate"
                      style={{ fontFamily: font.value }}
                    >
                      The quick brown fox jumps.
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                      {font.description}
                    </span>
                  </div>
                  {currentFont === font.name && (
                    <Check size={12} className="text-primary shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1" />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
