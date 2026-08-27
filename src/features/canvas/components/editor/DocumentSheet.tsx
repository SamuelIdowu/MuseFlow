"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DocumentBubbleMenu } from "./DocumentBubbleMenu";
import { EditorToolbar } from "./EditorToolbar";
import {
  Underline,
  TextAlign,
  TextStyle,
  CustomLink,
  CustomImage,
} from "./tiptapExtensions";
import { Cloud, Sparkles } from "lucide-react";

interface DocumentSheetProps {
  content: string;
  onChange: (html: string, wordCount: number, charCount: number) => void;
  documentTitle: string;
  onDocumentTitleChange: (title: string) => void;
  onEditorReady?: (editor: any) => void;
}

export function DocumentSheet({
  content,
  onChange,
  documentTitle,
  onDocumentTitleChange,
  onEditorReady,
}: DocumentSheetProps) {
  const [subtitle, setSubtitle] = useState("UX Research & Creator Edition");
  const [excerpt, setExcerpt] = useState(
    "Explores how intentional design decisions and clear copywriting create high-retention experiences."
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start typing your masterpiece... Highlight text to Ask AI for tone adjustments & rewrites.",
      }),
      Underline,
      TextAlign,
      TextStyle,
      CustomLink,
      CustomImage,
    ],
    content:
      content ||
      `<h2>Introduction</h2><p>Every great product begins not with wireframes or fancy UI kits, but with a deep understanding of human behavior. Good UX is like an invisible hand that gently guides users to where they need to go without them even noticing.</p><p>The biggest mistake many creators make is assuming they already know what users want. But real users are unpredictable. They get distracted, they misunderstand labels, and sometimes, they just want the fastest way to finish a task.</p>`,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      onChange(html, words, chars);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-base sm:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[750px] leading-relaxed text-foreground [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-medium [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-foreground/90",
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync external content update if needed
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      if (Math.abs(content.length - editor.getHTML().length) > 10) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  return (
    <div className="w-full max-w-4xl mx-auto my-2 sm:my-4 bg-card border border-border/80 shadow-md rounded-2xl p-4 sm:p-8 md:p-10 relative transition-all min-h-[calc(100vh-120px)]">
      {/* Floating Selection Bubble Menu */}
      {editor && <DocumentBubbleMenu editor={editor} />}

      {/* Top Document Header & Subtitle */}
      <div className="mb-6 pb-6 border-b border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="hover:text-foreground cursor-pointer transition-colors">All notes</span>
            <span>&gt;</span>
            <span className="text-foreground font-semibold truncate">{documentTitle || "Untitled Document"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
            <Cloud size={13} className="text-primary/70" />
            <span>Saved in Cloud</span>
          </div>
        </div>

        {/* Editable Title */}
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onDocumentTitleChange(e.target.value)}
          placeholder="Untitled Document Title"
          className="w-full text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0 px-0 mb-1"
        />

        {/* Subtitle / Edition Input */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Document Subtitle / Edition"
          className="w-full text-sm sm:text-base font-medium text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0 px-0 mb-3"
        />

        {/* Featured Excerpt Box */}
        <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Featured excerpt
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary or hook..."
            rows={2}
            className="w-full text-xs sm:text-sm text-foreground/80 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 p-0"
          />
        </div>
      </div>

      {/* Full WYSIWYG Editor Toolbar */}
      {editor && <EditorToolbar editor={editor} />}

      {/* Tiptap Editor Content Sheet */}
      <div className="min-h-[650px] cursor-text pt-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
