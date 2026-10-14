"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code } from "lucide-react";

interface FormattingButtonsProps {
  editor: Editor;
}

export function FormattingButtons({ editor }: FormattingButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md font-bold text-xs transition-colors ${
          editor.isActive("bold")
            ? "bg-primary text-primary-foreground font-extrabold shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          editor.isActive("italic")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </button>

      <button
        type="button"
        onClick={() =>
          (editor.chain().focus() as unknown as { toggleUnderline: () => { run: () => boolean } })
            .toggleUnderline()
            .run()
        }
        className={`p-1.5 rounded-md text-xs transition-colors ${
          editor.isActive("underline")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          editor.isActive("strike")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          editor.isActive("code")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Inline Code"
      >
        <Code size={14} />
      </button>
    </div>
  );
}
