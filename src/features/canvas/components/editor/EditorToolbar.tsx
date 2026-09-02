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
  Loader2,
  Bot,
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

export interface EditorToolbarProps {
  editor: Editor | null;
  activeFont?: string;
  onFontChange?: (fontName: string, fontValue: string) => void;
  isAutocompleteEnabled?: boolean;
  onToggleAutocomplete?: () => void;
  isGeneratingAutocomplete?: boolean;
  completionSource?: "research_agent" | "gemini_fallback" | null;
}

export const FONT_FAMILIES = [
  {
    name: "Inter",
    value: "'Inter', sans-serif",
    label: "Inter",
    description: "Clean modern sans-serif",
    category: "Sans-serif",
  },
  {
    name: "DM Sans",
    value: "'DM Sans', sans-serif",
    label: "DM Sans",
    description: "Geometric, readable",
    category: "Sans-serif",
  },
  {
    name: "Lato",
    value: "'Lato', sans-serif",
    label: "Lato",
    description: "Humanist, friendly",
    category: "Sans-serif",
  },
  {
    name: "Nunito",
    value: "'Nunito', sans-serif",
    label: "Nunito",
    description: "Rounded, approachable",
    category: "Sans-serif",
  },
  {
    name: "Space Grotesk",
    value: "'Space Grotesk', sans-serif",
    label: "Space Grotesk",
    description: "Tech-forward, modern",
    category: "Sans-serif",
  },
  {
    name: "Playfair Display",
    value: "'Playfair Display', Georgia, serif",
    label: "Playfair Display",
    description: "Elegant editorial serif",
    category: "Serif",
  },
  {
    name: "Merriweather",
    value: "'Merriweather', serif",
    label: "Merriweather",
    description: "Classic book reading",
    category: "Serif",
  },
  {
    name: "Libre Baskerville",
    value: "'Libre Baskerville', serif",
    label: "Libre Baskerville",
    description: "Newspaper-style serif",
    category: "Serif",
  },
  {
    name: "Crimson Text",
    value: "'Crimson Text', serif",
    label: "Crimson Text",
    description: "Long-form prose serif",
    category: "Serif",
  },
  {
    name: "Source Serif 4",
    value: "'Source Serif 4', serif",
    label: "Source Serif 4",
    description: "Adobe editorial serif",
    category: "Serif",
  },
  {
    name: "Cormorant Garamond",
    value: "'Cormorant Garamond', serif",
    label: "Cormorant Garamond",
    description: "Luxury fashion editorial",
    category: "Serif",
  },
  {
    name: "JetBrains Mono",
    value: "'JetBrains Mono', monospace",
    label: "JetBrains Mono",
    description: "Developer monospace",
    category: "Monospace",
  },
  {
    name: "Roboto Mono",
    value: "'Roboto Mono', monospace",
    label: "Roboto Mono",
    description: "Clean terminal mono",
    category: "Monospace",
  },
  {
    name: "System UI",
    value: "system-ui, -apple-system, sans-serif",
    label: "System UI",
    description: "OS native default",
    category: "System",
  },
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

const TEXT_COLOR_PALETTES = [
  {
    category: "Neutrals & Slate",
    colors: [
      { name: "Default (Theme)", value: "" },
      { name: "Dark Slate", value: "#0f172a" },
      { name: "Charcoal", value: "#334155" },
      { name: "Muted Slate", value: "#64748b" },
      { name: "Light Slate", value: "#94a3b8" },
    ],
  },
  {
    category: "Warm & Vibrant",
    colors: [
      { name: "Ruby Red", value: "#e11d48" },
      { name: "Electric Rose", value: "#f43f5e" },
      { name: "Primary Orange", value: "#ea580c" },
      { name: "Amber Gold", value: "#d97706" },
      { name: "Warm Sun", value: "#eab308" },
    ],
  },
  {
    category: "Cool & Modern",
    colors: [
      { name: "Emerald Green", value: "#059669" },
      { name: "Teal Cyan", value: "#0d9488" },
      { name: "Sky Blue", value: "#0284c7" },
      { name: "Electric Indigo", value: "#4f46e5" },
      { name: "Deep Purple", value: "#7c3aed" },
    ],
  },
  {
    category: "Deep Rich Tones",
    colors: [
      { name: "Midnight Navy", value: "#1e1b4b" },
      { name: "Wine Red", value: "#881337" },
      { name: "Forest Deep", value: "#14532d" },
      { name: "Ocean Deep", value: "#0c4a6e" },
      { name: "Royal Violet", value: "#581c87" },
    ],
  },
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "rgba(254, 240, 138, 0.65)" },
  { name: "Green", value: "rgba(187, 247, 208, 0.65)" },
  { name: "Blue", value: "rgba(186, 230, 253, 0.65)" },
  { name: "Pink", value: "rgba(251, 207, 232, 0.65)" },
  { name: "Purple", value: "rgba(233, 213, 255, 0.65)" },
  { name: "Orange", value: "rgba(254, 215, 170, 0.65)" },
  { name: "Coral", value: "rgba(254, 205, 211, 0.65)" },
];

export function EditorToolbar({
  editor,
  activeFont,
  onFontChange,
  isAutocompleteEnabled = true,
  onToggleAutocomplete,
  isGeneratingAutocomplete = false,
  completionSource,
}: EditorToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const [internalFont, setInternalFont] = useState("Inter");
  const currentFont = activeFont || internalFont;
  const [currentSize, setCurrentSize] = useState("16");
  const [currentColor, setCurrentColor] = useState("");
  const [currentHighlight, setCurrentHighlight] = useState("");
  const [customHex, setCustomHex] = useState("#ea580c");
  const [customHighlightHex, setCustomHighlightHex] = useState("#fef08a");

  if (!editor) return null;

  const handleApplyCustomTextColor = (hex: string) => {
    if (!hex) return;
    let formatted = hex.trim();
    if (!formatted.startsWith("#")) formatted = `#${formatted}`;
    setCurrentColor(formatted);
    (editor.chain().focus() as any).setColor(formatted).run();
  };

  const handleApplyCustomHighlight = (hex: string) => {
    if (!hex) return;
    let formatted = hex.trim();
    if (!formatted.startsWith("#")) formatted = `#${formatted}`;
    // Add soft opacity if hex is 6 chars
    const colorWithAlpha = formatted.length === 7 ? `${formatted}99` : formatted;
    setCurrentHighlight(colorWithAlpha);
    (editor.chain().focus() as any).setHighlight(colorWithAlpha).run();
  };

  const handleFontSelect = (font: typeof FONT_FAMILIES[number]) => {
    setInternalFont(font.name);
    onFontChange?.(font.name, font.value);
    // If text is selected, apply to selection; otherwise set stored mark & focus
    if (editor) {
      (editor.chain().focus() as any).setFontFamily(font.value).run();
      toast.success(`Applied ${font.label} font`, { duration: 1500 });
    }
  };

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
            <span
              className="max-w-[90px] truncate text-xs"
              style={{
                fontFamily: FONT_FAMILIES.find((f) => f.name === currentFont)?.value,
              }}
            >
              {currentFont}
            </span>
            <ChevronDown size={11} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 bg-card border-border shadow-xl p-1.5 z-50 max-h-[420px] overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Font Family
          </DropdownMenuLabel>
          {(["Sans-serif", "Serif", "Monospace", "System"] as const).map((category) => {
            const fonts = FONT_FAMILIES.filter((f) => f.category === category);
            if (!fonts.length) return null;
            return (
              <div key={category}>
                <div className="px-2 pt-2 pb-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {category}
                  </span>
                </div>
                {fonts.map((font) => (
                  <DropdownMenuItem
                    key={font.name}
                    onClick={() => handleFontSelect(font)}
                    className="flex items-start justify-between px-2 py-2 rounded-md cursor-pointer hover:bg-muted gap-2 group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      {/* Font name rendered in that font */}
                      <span
                        className="text-sm font-medium text-foreground leading-tight truncate"
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </span>
                      {/* Sample sentence in that font */}
                      <span
                        className="text-[11px] text-muted-foreground leading-snug truncate"
                        style={{ fontFamily: font.value }}
                      >
                        The quick brown fox jumps.
                      </span>
                      {/* Description tag */}
                      <span className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                        {font.description}
                      </span>
                    </div>
                    {currentFont === font.name && (
                      <Check size={12} className="text-primary shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-1" />
              </div>
            );
          })}
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
        <DropdownMenuContent align="start" className="w-72 bg-card border-border shadow-2xl p-3 z-50 space-y-3 max-h-[500px] overflow-y-auto">
          {/* TEXT COLOR SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Text Color
              </span>
              {currentColor && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentColor("");
                    (editor.chain().focus() as any).unsetColor().run();
                  }}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  Reset Default
                </button>
              )}
            </div>

            {/* Interactive Color Gradient Bar */}
            <div className="relative h-7 rounded-lg overflow-hidden border border-border/80 shadow-xs bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-sky-400 via-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center cursor-pointer group mb-2.5">
              <input
                type="color"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  handleApplyCustomTextColor(e.target.value);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                title="Click gradient to pick any color"
              />
              <span className="text-[10px] font-semibold text-white drop-shadow-md pointer-events-none flex items-center gap-1 tracking-tight">
                <Palette size={11} className="drop-shadow-xs" />
                Pick from gradient spectrum
              </span>
            </div>

            {/* Custom Hex Input Row */}
            <div className="flex items-center gap-1.5 mb-3">
              <div
                className="w-6 h-6 rounded-md border border-border shadow-2xs shrink-0 transition-colors"
                style={{ backgroundColor: customHex }}
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCustomTextColor(customHex);
                    }
                  }}
                  placeholder="#ea580c"
                  className="w-full text-[11px] font-mono px-2 py-1 rounded-md border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleApplyCustomTextColor(customHex)}
                className="h-6 px-2 text-[10px] shrink-0"
              >
                Apply
              </Button>
            </div>

            {/* Curated Color Palettes */}
            <div className="space-y-2">
              {TEXT_COLOR_PALETTES.map((group) => (
                <div key={group.category}>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 block mb-1">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {group.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setCurrentColor(c.value);
                          if (c.value) {
                            (editor.chain().focus() as any).setColor(c.value).run();
                          } else {
                            (editor.chain().focus() as any).unsetColor().run();
                          }
                        }}
                        className="w-full h-6 rounded-md border border-border/70 flex items-center justify-center hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.value || "var(--foreground)" }}
                        title={c.name}
                      >
                        {currentColor === c.value && <Check size={11} className="text-white drop-shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* HIGHLIGHT COLOR SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Highlight Color
              </span>
              {currentHighlight && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentHighlight("");
                    (editor.chain().focus() as any).unsetHighlight().run();
                  }}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  Clear Highlight
                </button>
              )}
            </div>

            {/* Pastel & Neon Highlighters */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => {
                    setCurrentHighlight(h.value);
                    if (h.value) {
                      (editor.chain().focus() as any).setHighlight(h.value).run();
                    } else {
                      (editor.chain().focus() as any).unsetHighlight().run();
                    }
                  }}
                  className="h-6 px-1 rounded-md border border-border/70 text-[10px] font-medium flex items-center justify-center hover:opacity-80 transition-opacity truncate"
                  style={{ backgroundColor: h.value || "transparent" }}
                  title={h.name}
                >
                  {h.name}
                </button>
              ))}
            </div>

            {/* Custom Highlight Color Input */}
            <div className="relative h-6 rounded-md overflow-hidden border border-border/70 bg-gradient-to-r from-yellow-200 via-green-200 via-blue-200 via-pink-200 to-amber-200 flex items-center justify-center cursor-pointer">
              <input
                type="color"
                value={customHighlightHex}
                onChange={(e) => {
                  setCustomHighlightHex(e.target.value);
                  handleApplyCustomHighlight(e.target.value);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                title="Pick custom highlight color"
              />
              <span className="text-[9.5px] font-medium text-gray-800 pointer-events-none flex items-center gap-1">
                <Sparkles size={10} />
                Custom Highlight Tone
              </span>
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

      {/* 9. Real-time AI Autocomplete Toggle */}
      {onToggleAutocomplete && (
        <>
          <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
          <button
            type="button"
            onClick={onToggleAutocomplete}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 select-none ${
              isAutocompleteEnabled
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40 hover:text-foreground"
            }`}
            title={
              isAutocompleteEnabled
                ? "Inline AI Autocomplete is ON (Press Tab ⇥ to accept suggestions)"
                : "Inline AI Autocomplete is paused (Click to enable)"
            }
          >
            {isGeneratingAutocomplete ? (
              <Loader2 size={13} className="animate-spin text-amber-500" />
            ) : completionSource === "research_agent" ? (
              <Bot size={13} className="text-amber-500" />
            ) : (
              <Sparkles
                size={13}
                className={isAutocompleteEnabled ? "text-amber-500 fill-amber-500/20" : "text-muted-foreground"}
              />
            )}
            <span className="hidden md:inline text-[11px]">
              AI Autocomplete:
            </span>
            <span className="text-[11px] font-semibold">
              {isAutocompleteEnabled ? "ON" : "OFF"}
            </span>
            {isAutocompleteEnabled && (
              <span className="text-[9.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono hidden lg:inline">
                Tab ⇥
              </span>
            )}
          </button>
        </>
      )}

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
