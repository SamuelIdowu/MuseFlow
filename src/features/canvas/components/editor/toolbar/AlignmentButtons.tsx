"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

interface AlignmentButtonsProps {
  editor: Editor;
}

export function AlignmentButtons({ editor }: AlignmentButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setTextAlign("left").run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: "left" }) ||
          (!editor.isActive({ textAlign: "center" }) &&
            !editor.isActive({ textAlign: "right" }) &&
            !editor.isActive({ textAlign: "justify" }))
            ? "bg-muted text-primary font-bold"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title="Align Left"
      >
        <AlignLeft size={14} />
      </button>

      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setTextAlign("center").run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: "center" })
            ? "bg-muted text-primary font-bold"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title="Align Center"
      >
        <AlignCenter size={14} />
      </button>

      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setTextAlign("right").run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: "right" })
            ? "bg-muted text-primary font-bold"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title="Align Right"
      >
        <AlignRight size={14} />
      </button>

      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setTextAlign("justify").run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: "justify" })
            ? "bg-muted text-primary font-bold"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title="Align Justify"
      >
        <AlignJustify size={14} />
      </button>
    </div>
  );
}
