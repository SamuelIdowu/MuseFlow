"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import { List, ListOrdered, Quote, Code2, Minus } from "lucide-react";

interface BlockButtonsProps {
  editor: Editor;
}

export function BlockButtons({ editor }: BlockButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive("bulletList")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Bullet List"
      >
        <List size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive("orderedList")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive("blockquote")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Blockquote"
      >
        <Quote size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive("codeBlock")
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
        title="Code Block"
      >
        <Code2 size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Divider Line"
      >
        <Minus size={14} />
      </button>
    </div>
  );
}
