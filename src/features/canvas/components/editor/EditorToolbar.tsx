"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Unlink,
  Image as ImageIcon,
  Undo2,
  Redo2,
  ChevronDown,
  Type,
  Check,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface EditorToolbarProps {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { name: "Inter", value: "var(--font-inter, 'Inter', sans-serif)", label: "Inter (Sans)" },
  { name: "Space Grotesk", value: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)", label: "Space Grotesk (Modern)" },
  { name: "Playfair Display", value: "'Playfair Display', Georgia, serif", label: "Playfair (Editorial Serif)" },
  { name: "Merriweather", value: "'Merriweather', serif", label: "Merriweather (Book Serif)" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace", label: "JetBrains Mono (Code)" },
  { name: "System Sans", value: "system-ui, -apple-system, sans-serif", label: "System UI" },
];

const FONT_SIZES = [
  { label: "12px", value: "12px", name: "12" },
  { label: "14px", value: "14px", name: "14" },
  { label: "16px", value: "16px", name: "16" },
  { label: "18px", value: "18px", name: "18" },
  { label: "20px", value: "20px", name: "20" },
  { label: "24px", value: "24px", name: "24" },
  { label: "30px", value: "30px", name: "30" },
  { label: "36px", value: "36px", name: "36" },
];

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Muted Gray", value: "#64748b" },
  { name: "Dark Slate", value: "#0f172a" },
  { name: "Electric Indigo", value: "#6366f1" },
  { name: "Emerald Green", value: "#10b981" },
  { name: "Rose Red", value: "#f43f5e" },
  { name: "Amber Orange", value: "#f59e0b" },
  { name: "Sky Blue", value: "#0ea5e9" },
  { name: "Purple", value: "#a855f7" },
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "rgba(254, 240, 138, 0.5)" },
  { name: "Green", value: "rgba(187, 247, 208, 0.5)" },
  { name: "Blue", value: "rgba(186, 230, 253, 0.5)" },
  { name: "Pink", value: "rgba(251, 207, 232, 0.5)" },
  { name: "Purple", value: "rgba(233, 213, 255, 0.5)" },
  { name: "Orange", value: "rgba(254, 215, 170, 0.5)" },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const [currentFont, setCurrentFont] = useState("Inter");
  const [currentSize, setCurrentSize] = useState("16");
  const [currentColor, setCurrentColor] = useState("");

  if (!editor) return null;

  // Handle Hyperlink apply
  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      (editor.commands as any).unsetLink();
      toast.success("Link removed");
    } else {
      let formattedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      (editor.commands as any).setLink({ href: formattedUrl });
      toast.success("Link applied");
    }
    setIsLinkDialogOpen(false);
    setLinkUrl("");
  };

  // Handle Image Insert
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    (editor.commands as any).setImage({ src: imageUrl.trim(), alt: imageAlt.trim() });
    toast.success("Image inserted");
    setIsImageDialogOpen(false);
    setImageUrl("");
    setImageAlt("");
  };

  return (
    <div className="w-full flex items-center flex-wrap gap-1 px-3 py-2 bg-card/95 border border-border/80 rounded-xl shadow-xs backdrop-blur-md mb-4 text-xs select-none sticky top-2 z-30 transition-all">
      {/* 1. Font Family Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 text-foreground font-medium transition-colors"
            title="Font Family"
          >
            <Type size={13} className="text-muted-foreground" />
            <span className="max-w-[80px] truncate">{currentFont}</span>
            <ChevronDown size={11} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-xl p-1 z-50">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
            Font Family
          </DropdownMenuLabel>
          {FONT_FAMILIES.map((font) => (
            <DropdownMenuItem
              key={font.name}
              onClick={() => {
                setCurrentFont(font.name);
                (editor.chain().focus() as any).setFontFamily(font.value);
              }}
              className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-muted"
            >
              <span>{font.label}</span>
              {currentFont === font.name && <Check size={12} className="text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Font Size Dropdown */}
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
        <DropdownMenuContent align="start" className="w-32 bg-card border-border shadow-xl p-1 z-50">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
            Font Size
          </DropdownMenuLabel>
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size.value}
              onClick={() => {
                setCurrentSize(size.name);
                (editor.chain().focus() as any).setFontSize(size.value);
              }}
              className="flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-muted"
            >
              <span>{size.label}</span>
              {currentSize === size.name && <Check size={12} className="text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Text Color & Highlighter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 transition-colors"
            title="Text & Highlight Color"
          >
            <div
              className="w-3.5 h-3.5 rounded-xs border border-border/80 shadow-2xs"
              style={{ backgroundColor: currentColor || "currentColor" }}
            />
            <ChevronDown size={11} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-card border-border shadow-2xl p-3 z-50 space-y-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Text Color
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCurrentColor(c.value);
                    if (c.value) {
                      (editor.chain().focus() as any).setColor(c.value);
                    } else {
                      (editor.chain().focus() as any).unsetColor();
                    }
                  }}
                  className="w-6 h-6 rounded-md border border-border/70 flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value || "var(--foreground)" }}
                  title={c.name}
                >
                  {currentColor === c.value && <Check size={10} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Highlight Color
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => {
                    if (h.value) {
                      (editor.chain().focus() as any).setHighlight(h.value);
                    } else {
                      (editor.chain().focus() as any).unsetHighlight();
                    }
                  }}
                  className="h-6 px-1.5 rounded-md border border-border/70 text-[10px] font-medium flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: h.value || "transparent" }}
                  title={h.name}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 4. Text Styles: Bold, Italic, Underline, Strike, Code */}
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
          onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
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

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 5. Text Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => (editor.chain().focus() as any).setTextAlign("left").run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive({ textAlign: "left" }) || (!editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" }) && !editor.isActive({ textAlign: "justify" }))
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

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 6. Lists & Blocks */}
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

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 7. Image & Link */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setIsImageDialogOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Insert Image"
        >
          <ImageIcon size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href || "";
            setLinkUrl(previousUrl);
            setIsLinkDialogOpen(true);
          }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("link")
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Hyperlink"
        >
          <Link2 size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-border/60 mx-1" />

      {/* 8. Undo / Redo */}
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

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editor.isActive("link") ? "Edit Link" : "Insert Hyperlink"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter the target destination URL for the highlighted text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-xs h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyLink();
                }
              }}
            />
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            {editor.isActive("link") ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  (editor.commands as any).unsetLink();
                  setIsLinkDialogOpen(false);
                  toast.success("Link removed");
                }}
                className="h-8 text-destructive text-xs hover:bg-destructive/10"
              >
                <Unlink size={12} className="mr-1" /> Remove Link
              </Button>
            ) : <div />}
            <Button size="sm" onClick={handleApplyLink} className="h-8 text-xs">
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Insert Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Insert Web Image</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a direct image URL (PNG, JPG, SVG, WebP, GIF) to embed in your document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Image URL</label>
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Alt Text (Description)</label>
              <Input
                placeholder="Visual mockup / illustration"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsertImage}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
