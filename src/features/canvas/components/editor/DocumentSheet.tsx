"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DocumentBubbleMenu } from "./DocumentBubbleMenu";
import {
  Underline,
  TextAlign,
  Color,
  Highlight,
  FontSize,
  FontFamily,
  TextStyle,
  CustomLink,
  CustomImage,
  InlineCompletion,
} from "./tiptapExtensions";
import { generateContentContinuationAction } from "../../actions/editorActions";
import { Cloud, Sparkles, Bot } from "lucide-react";

interface DocumentSheetProps {
  content: string;
  onChange: (html: string, wordCount: number, charCount: number) => void;
  documentTitle: string;
  onDocumentTitleChange: (title: string) => void;
  subtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  excerpt?: string;
  onExcerptChange?: (excerpt: string) => void;
  onEditorReady?: (editor: any) => void;
  fontFamily?: string;
  isAutocompleteEnabled?: boolean;
  onAutocompleteStatusChange?: (status: {
    isGenerating: boolean;
    source?: "research_agent" | "gemini_fallback" | null;
  }) => void;
}

export function DocumentSheet({
  content,
  onChange,
  documentTitle,
  onDocumentTitleChange,
  subtitle = "UX Research & Creator Edition",
  onSubtitleChange,
  excerpt = "Explores how intentional design decisions and clear copywriting create high-retention experiences.",
  onExcerptChange,
  onEditorReady,
  fontFamily,
  isAutocompleteEnabled = true,
  onAutocompleteStatusChange,
}: DocumentSheetProps) {
  const autocompleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutocompleteEnabledRef = useRef(isAutocompleteEnabled);
  isAutocompleteEnabledRef.current = isAutocompleteEnabled;

  const documentTitleRef = useRef(documentTitle);
  documentTitleRef.current = documentTitle;
  const autocompleteSeqRef = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder:
          "Start typing your masterpiece... Real-time AI will suggest continuations (press Tab to accept).",
      }),
      Underline,
      TextAlign,
      Color,
      Highlight,
      FontSize,
      FontFamily,
      TextStyle,
      CustomLink,
      CustomImage,
      InlineCompletion,
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

      // Debounced inline ghost autocomplete trigger
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }

      if (isAutocompleteEnabledRef.current) {
        autocompleteTimerRef.current = setTimeout(async () => {
          if (!editor || editor.isDestroyed) return;
          const { selection } = editor.state;
          if (!selection.empty) return;

          const pos = selection.from;
          const docText = editor.state.doc.textBetween(0, pos, "\n");
          if (docText.trim().length < 8) return;

          const currentSeq = ++autocompleteSeqRef.current;
          onAutocompleteStatusChange?.({ isGenerating: true });
          try {
            const res = await generateContentContinuationAction({
              currentContent: html,
              documentTitle: documentTitleRef.current,
            });

            // Discard if user continued typing or another request was fired
            if (currentSeq !== autocompleteSeqRef.current) {
              return;
            }

            onAutocompleteStatusChange?.({
              isGenerating: false,
              source: res.source || null,
            });

            if (res.success && res.result && res.result.trim().length > 0) {
              if (
                !editor.isDestroyed &&
                editor.state.selection.empty &&
                editor.state.selection.from === pos
              ) {
                (editor.commands as any).setGhostSuggestion({
                  text: res.result,
                  pos,
                  source: res.source,
                });
              }
            }
          } catch {
            if (currentSeq === autocompleteSeqRef.current) {
              onAutocompleteStatusChange?.({ isGenerating: false, source: null });
            }
          }
        }, 1000);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-base sm:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] leading-relaxed text-foreground [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h3]:text-xl [&_h3]:font-medium [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3.5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/90 [&_blockquote]:mb-3.5",
      },
    },
  });

  useEffect(() => {
    return () => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync external content update if needed
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto my-1.5 sm:my-2.5 bg-card border border-border/80 shadow-xs rounded-xl px-3 sm:px-6 md:px-8 py-3.5 sm:py-5 relative transition-all min-h-[calc(100vh-130px)] h-auto mb-10">
      {/* Floating Selection Bubble Menu */}
      {editor && <DocumentBubbleMenu editor={editor} />}

      {/* Top Document Header & Subtitle */}
      <div className="mb-3.5 pb-3.5 border-b border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="hover:text-foreground cursor-pointer transition-colors">All notes</span>
            <span>&gt;</span>
            <span className="text-foreground font-semibold truncate">{documentTitle || "Untitled Document"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
            <Cloud size={13} className="text-primary/70" />
            <span>Saved locally & in Cloud</span>
          </div>
        </div>

        {/* Editable Title */}
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onDocumentTitleChange(e.target.value)}
          placeholder="Untitled Document Title"
          className="w-full text-2xl sm:text-3xl font-extrabold tracking-tight bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0 px-0 mb-1"
        />

        {/* Subtitle / Edition Input */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onSubtitleChange?.(e.target.value)}
          placeholder="Document Subtitle / Edition"
          className="w-full text-xs sm:text-sm font-medium text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0 px-0 mb-2"
        />

        {/* Featured Excerpt Box */}
        <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Featured excerpt
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => onExcerptChange?.(e.target.value)}
            placeholder="Brief summary or hook..."
            rows={2}
            className="w-full text-xs sm:text-sm text-foreground/80 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 p-0"
          />
        </div>
      </div>

      {/* Tiptap Editor Content Sheet with Dynamic Font Family */}
      <div
        className="min-h-[400px] cursor-text pt-1 pb-6"
        style={{ fontFamily: fontFamily || "'Inter', sans-serif" }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
