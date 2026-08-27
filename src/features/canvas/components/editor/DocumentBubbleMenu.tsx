"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  ChevronDown,
  Wand2,
  Check,
  Loader2,
  ArrowRight,
  RefreshCw,
  Minimize2,
  Maximize2,
  SpellCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { transformSelectedTextAction, type AiTransformCommand } from "../../actions/editorActions";
import { toast } from "react-hot-toast";

interface DocumentBubbleMenuProps {
  editor: Editor | null;
}

const TONES = [
  { name: "Persuasive", desc: "Convincing & high-converting" },
  { name: "Bold & Authoritative", desc: "Confident thought leader" },
  { name: "Friendly & Conversational", desc: "Approachable and warm" },
  { name: "Formal & Professional", desc: "Polished corporate standard" },
  { name: "Educational & Clear", desc: "Informative breakdown" },
  { name: "Humorous & Witty", desc: "Engaging and playful" },
];

export function DocumentBubbleMenu({ editor }: DocumentBubbleMenuProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);

  const updateMenu = useCallback(() => {
    if (!editor || isMouseDownRef.current) return;

    const { selection } = editor.state;
    const { empty, from, to } = selection;

    if (empty || from === to) {
      if (!isDropdownOpen) {
        setIsVisible(false);
      }
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText || !selectedText.trim()) {
      if (!isDropdownOpen) {
        setIsVisible(false);
      }
      return;
    }

    // Check window selection
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      if (!isDropdownOpen) {
        setIsVisible(false);
      }
      return;
    }

    try {
      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        if (!isDropdownOpen) {
          setIsVisible(false);
        }
        return;
      }

      // Position above selection, or below if too close to top
      const menuHeight = 44;
      const top = rect.top - menuHeight - 10;
      const finalTop = top < 60 ? rect.bottom + 10 : top;
      const finalLeft = Math.max(160, Math.min(window.innerWidth - 160, rect.left + rect.width / 2));

      setMenuPosition({
        top: finalTop,
        left: finalLeft,
      });
      setIsVisible(true);
    } catch {
      // Fallback
    }
  }, [editor, isDropdownOpen]);

  useEffect(() => {
    if (!editor) return;

    const handleMouseDown = (e: MouseEvent) => {
      // If click is inside the bubble menu, don't treat it as a drag
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      isMouseDownRef.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      isMouseDownRef.current = false;
      // Slight timeout to let DOM selection settle
      setTimeout(() => {
        updateMenu();
      }, 20);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(
          e.key
        ) ||
        (e.shiftKey && e.key.length === 1) ||
        (e.ctrlKey && (e.key === "a" || e.key === "A"))
      ) {
        setTimeout(() => {
          updateMenu();
        }, 20);
      }
    };

    const handleSelectionUpdate = () => {
      // Only show menu if mouse is NOT actively dragging
      if (!isMouseDownRef.current) {
        updateMenu();
      }
    };

    const handleBlur = ({ event }: { event: FocusEvent }) => {
      // If focus moved inside our menu, don't hide
      if (
        menuRef.current &&
        event?.relatedTarget &&
        menuRef.current.contains(event.relatedTarget as Node)
      ) {
        return;
      }

      setTimeout(() => {
        if (!isDropdownOpen) {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) {
            setIsVisible(false);
          }
        }
      }, 250);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", handleBlur);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", handleBlur);
    };
  }, [editor, isDropdownOpen, updateMenu]);

  if (!editor || !isVisible || !menuPosition) return null;

  const handleAiTransform = async (
    command: AiTransformCommand,
    tone?: string,
    customPrompt?: string
  ) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (!selectedText || selectedText.trim().length === 0) {
      toast.error("Please highlight some text first");
      return;
    }

    setIsAiLoading(true);
    const toastId = toast.loading("Transforming with AI...");

    try {
      const res = await transformSelectedTextAction({
        text: selectedText,
        command,
        tone,
        customPrompt,
      });

      if (res.success && res.result) {
        editor.chain().focus().insertContentAt({ from, to }, res.result).run();
        toast.success("Text transformed!", { id: toastId });
        setIsDropdownOpen(false);
        setCustomAiPrompt("");
        setIsVisible(false);
      } else {
        toast.error(res.error || "Failed to transform text", { id: toastId });
      }
    } catch (err) {
      console.error("AI Transform Error:", err);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAiPrompt.trim() || isAiLoading) return;
    handleAiTransform("custom", undefined, customAiPrompt.trim());
  };

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => {
        // Prevent clicking inside bubble menu from deselecting editor text
        if ((e.target as HTMLElement).tagName !== "INPUT") {
          e.preventDefault();
        }
      }}
      style={{
        position: "fixed",
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        transform: "translateX(-50%)",
      }}
      className="flex items-center gap-0.5 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-100 p-1 rounded-xl shadow-2xl border border-zinc-800/80 z-50 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Ask AI Trigger Button */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isAiLoading}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-amber-400 hover:text-amber-300 hover:bg-zinc-800/90 transition-colors shrink-0"
          >
            {isAiLoading ? (
              <Loader2 size={14} className="animate-spin text-amber-400" />
            ) : (
              <Sparkles size={14} className="text-amber-400 fill-amber-400/20" />
            )}
            <span>Ask AI</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-72 bg-zinc-900 text-zinc-100 border-zinc-800 shadow-2xl p-1.5 rounded-xl z-50"
        >
          {/* Custom prompt input */}
          <form onSubmit={handleCustomPromptSubmit} className="p-1 mb-1">
            <div className="relative flex items-center">
              <input
                type="text"
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                placeholder="Ask AI to edit or generate..."
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={!customAiPrompt.trim() || isAiLoading}
                className="absolute right-1.5 p-1 rounded hover:bg-zinc-700 text-amber-400 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </form>

          <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-zinc-400 px-2 py-1 tracking-wider">
            Quick Actions
          </DropdownMenuLabel>

          <DropdownMenuGroup>
            {/* Tone sub-menu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                <Wand2 size={13} className="text-amber-400" />
                <span>Adjust tone</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 bg-zinc-900 text-zinc-100 border-zinc-800 shadow-2xl p-1 rounded-xl">
                {TONES.map((t) => (
                  <DropdownMenuItem
                    key={t.name}
                    onClick={() => handleAiTransform("adjust_tone", t.name)}
                    className="flex flex-col items-start px-2 py-1.5 rounded-md hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                  >
                    <span className="font-medium text-xs text-zinc-200">{t.name}</span>
                    <span className="text-[10px] text-zinc-400">{t.desc}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem
              onClick={() => handleAiTransform("rephrase")}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
            >
              <RefreshCw size={13} className="text-blue-400" />
              <span>Rephrase & Polish</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleAiTransform("make_shorter")}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
            >
              <Minimize2 size={13} className="text-emerald-400" />
              <span>Make shorter</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleAiTransform("make_longer")}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
            >
              <Maximize2 size={13} className="text-purple-400" />
              <span>Expand & Elaborate</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleAiTransform("fix_grammar")}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
            >
              <SpellCheck size={13} className="text-rose-400" />
              <span>Fix grammar & flow</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-zinc-700/80 mx-1" />

      {/* Headings Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-colors"
          >
            <span>
              {editor.isActive("heading", { level: 1 })
                ? "H1"
                : editor.isActive("heading", { level: 2 })
                ? "H2"
                : editor.isActive("heading", { level: 3 })
                ? "H3"
                : "Text"}
            </span>
            <ChevronDown size={11} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-36 bg-zinc-900 text-zinc-100 border-zinc-800 shadow-xl p-1 rounded-xl z-50"
        >
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-zinc-800 cursor-pointer"
          >
            <span>Paragraph</span>
            {!editor.isActive("heading") && <Check size={12} className="text-amber-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-zinc-800 cursor-pointer font-bold"
          >
            <span>Heading 1</span>
            {editor.isActive("heading", { level: 1 }) && <Check size={12} className="text-amber-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-zinc-800 cursor-pointer font-semibold"
          >
            <span>Heading 2</span>
            {editor.isActive("heading", { level: 2 }) && <Check size={12} className="text-amber-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-zinc-800 cursor-pointer font-medium"
          >
            <span>Heading 3</span>
            {editor.isActive("heading", { level: 3 }) && <Check size={12} className="text-amber-400" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-zinc-700/80 mx-1" />

      {/* Formatting buttons */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("bold")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("italic")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          (editor.chain().focus() as any).toggleUnderline().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("underline")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("strike")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Strikethrough"
      >
        <Strikethrough size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleCode().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("code")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Inline Code"
      >
        <Code size={13} />
      </button>

      <div className="w-px h-4 bg-zinc-700/80 mx-1" />

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("bulletList")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Bullet List"
      >
        <List size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("orderedList")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Numbered List"
      >
        <ListOrdered size={13} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBlockquote().run();
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive("blockquote")
            ? "bg-zinc-700 text-white"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800/90"
        }`}
        title="Blockquote"
      >
        <Quote size={13} />
      </button>
    </div>
  );
}

