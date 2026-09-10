"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  TEXT_COLOR_PALETTES,
  HIGHLIGHT_COLORS,
  type FontFamilyOption,
} from "./toolbar/toolbarConstants";
import { FontPicker } from "./toolbar/FontPicker";
import { FontSizePicker } from "./toolbar/FontSizePicker";
import { ColorPaletteDropdown } from "./toolbar/ColorPaletteDropdown";
import { FormattingButtons } from "./toolbar/FormattingButtons";
import { AlignmentButtons } from "./toolbar/AlignmentButtons";
import { BlockButtons } from "./toolbar/BlockButtons";
import { LinkImageDialogs } from "./toolbar/LinkImageDialogs";
import { HistoryButtons } from "./toolbar/HistoryButtons";
import { AutocompleteToggle } from "./toolbar/AutocompleteToggle";

// Re-export constants for full backward compatibility
export {
  FONT_FAMILIES,
  FONT_SIZES,
  TEXT_COLOR_PALETTES,
  HIGHLIGHT_COLORS,
  type FontFamilyOption,
};

export interface EditorToolbarProps {
  editor: Editor | null;
  activeFont?: string;
  onFontChange?: (fontName: string, fontValue: string) => void;
  isAutocompleteEnabled?: boolean;
  onToggleAutocomplete?: () => void;
  isGeneratingAutocomplete?: boolean;
  completionSource?: "research_agent" | "gemini_fallback" | null;
}

export function EditorToolbar({
  editor,
  activeFont,
  onFontChange,
  isAutocompleteEnabled = true,
  onToggleAutocomplete,
  isGeneratingAutocomplete = false,
  completionSource,
}: EditorToolbarProps) {
  const [internalFont, setInternalFont] = useState("Inter");
  const [currentSize, setCurrentSize] = useState("16");
  const currentFont = activeFont || internalFont;

  if (!editor) return null;

  return (
    <div className="w-full flex items-center flex-wrap gap-1 px-3 py-2 bg-card/95 border border-border/80 rounded-xl shadow-xs backdrop-blur-md mb-4 text-xs select-none sticky top-2 z-30 transition-all">
      {/* 1. Font Family Dropdown */}
      <FontPicker
        editor={editor}
        currentFont={currentFont}
        onFontChange={onFontChange}
        setInternalFont={setInternalFont}
      />

      {/* 2. Font Size Dropdown */}
      <FontSizePicker
        editor={editor}
        currentSize={currentSize}
        setCurrentSize={setCurrentSize}
      />

      {/* 3. Text Color & Highlighter Dropdown */}
      <ColorPaletteDropdown editor={editor} />

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 4. Text Styles: Bold, Italic, Underline, Strike, Code */}
      <FormattingButtons editor={editor} />

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 5. Text Alignment */}
      <AlignmentButtons editor={editor} />

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 6. Lists & Blocks */}
      <BlockButtons editor={editor} />

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 7. Image & Link */}
      <LinkImageDialogs editor={editor} />

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 8. Undo / Redo */}
      <HistoryButtons editor={editor} />

      {/* 9. Real-time AI Autocomplete Toggle */}
      <AutocompleteToggle
        isAutocompleteEnabled={isAutocompleteEnabled}
        onToggleAutocomplete={onToggleAutocomplete}
        isGeneratingAutocomplete={isGeneratingAutocomplete}
        completionSource={completionSource}
      />
    </div>
  );
}
