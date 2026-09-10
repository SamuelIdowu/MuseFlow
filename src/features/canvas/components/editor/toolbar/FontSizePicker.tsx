"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FONT_SIZES } from "./toolbarConstants";

interface FontSizePickerProps {
  editor: Editor;
  currentSize: string;
  setCurrentSize: (size: string) => void;
}

export function FontSizePicker({
  editor,
  currentSize,
  setCurrentSize,
}: FontSizePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 text-foreground font-medium transition-colors"
          title="Font Size"
        >
          <span>{currentSize}</span>
          <ChevronDown size={11} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-32 bg-card border-border shadow-xl p-1 z-50"
      >
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
          Font Size
        </DropdownMenuLabel>
        {FONT_SIZES.map((size) => (
          <DropdownMenuItem
            key={size.value}
            onClick={() => {
              setCurrentSize(size.name);
              (editor.chain().focus() as any).setFontSize(size.value).run();
            }}
            className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-muted"
          >
            <span>{size.label}</span>
            {currentSize === size.name && <Check size={12} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
