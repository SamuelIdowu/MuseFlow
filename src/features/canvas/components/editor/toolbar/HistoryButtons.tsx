"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { Undo2, Redo2 } from "lucide-react";

interface HistoryButtonsProps {
  editor: Editor;
}

export function HistoryButtons({ editor }: HistoryButtonsProps) {
  return (
    <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}
