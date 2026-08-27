"use client";

import React, { useState, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import {
  Sparkles,
  Sliders,
  ListTree,
  FileText,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Linkedin,
  Twitter,
  Mail,
  Compass,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

interface DocumentLeftSidebarProps {
  editor: Editor | null;
  isOpen: boolean;
  onToggle: () => void;
  activeProfileName?: string;
  activeNiche?: string;
  wordCount: number;
  charCount: number;
}

const TEMPLATES = [
  {
    name: "Hook-Story-Offer",
    desc: "High-converting social story",
    content: `<h2>🪝 The Hook</h2><p>Stop doing [Common Mistake]. Here's what the top 1% actually do instead...</p><h2>📖 The Story & Problem</h2><p>Three months ago, I noticed a huge bottleneck in our workflow...</p><h2>💡 The Core Solution</h2><p>We switched our approach to focus on three simple principles:</p><ul><li><strong>1. Clarity over cleverness:</strong> Keep your message laser-focused.</li><li><strong>2. Systematic execution:</strong> Automate repetitive friction points.</li><li><strong>3. Feedback loops:</strong> Iterate based on real metrics.</li></ul><h2>🎯 Call to Action (Offer)</h2><p>What's your biggest challenge with this? Drop a comment below or share your thoughts!</p>`,
  },
  {
    name: "Problem - Agitate - Solve (PAS)",
    desc: "Classic persuasive copywriting",
    content: `<h2>⚠️ The Core Problem</h2><p>Most creators spend hours writing content that receives zero engagement.</p><h2>🔥 Why It's Worse Than You Think</h2><p>Without structured hooks and a distinct voice, your insights get lost in the noise within 10 seconds.</p><h2>✅ The Solution & Framework</h2><p>Here is the exact 4-step framework we use to generate high-retention posts in under 15 minutes:</p><ol><li><strong>Identify the tension:</strong> Speak directly to a specific audience pain.</li><li><strong>Deliver the insight:</strong> Provide actionable, non-obvious advice.</li><li><strong>Provide proof:</strong> Share metrics, quotes, or practical examples.</li><li><strong>Clear CTA:</strong> Tell the reader exactly what to do next.</li></ol>`,
  },
  {
    name: "Actionable 5-Point Listicle",
    desc: "Digestible authority breakdown",
    content: `<h2>📌 5 Rules for Building Scalable Systems</h2><p>If you want to 10x your output without burning out, master these five rules:</p><p><strong>1. Document everything:</strong> Create templates before you scale.</p><p><strong>2. Eliminate before automating:</strong> Don't optimize what shouldn't exist.</p><p><strong>3. Protect deep work:</strong> Block out uninterrupted focus windows.</p><p><strong>4. Leverage AI for initial drafts:</strong> Never start with a blank page.</p><p><strong>5. Measure leading indicators:</strong> Focus on input volume and quality.</p>`,
  },
];

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn Post", maxChars: 3000, icon: Linkedin },
  { id: "twitter", label: "X / Thread", maxChars: 280, icon: Twitter },
  { id: "newsletter", label: "Newsletter / Blog", maxChars: 8000, icon: Mail },
];

export function DocumentLeftSidebar({
  editor,
  isOpen,
  onToggle,
  activeProfileName = "Default Creator",
  activeNiche = "Technology & SaaS",
  wordCount,
  charCount,
}: DocumentLeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<"companion" | "outline">("companion");
  const [selectedChannel, setSelectedChannel] = useState("linkedin");
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  // Generate dynamic outline from Tiptap document headings
  const updateOutline = React.useCallback(() => {
    if (!editor) {
      setOutline([]);
      return;
    }
    const items: OutlineItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent;
        if (text.trim()) {
          items.push({
            id: `heading-${pos}`,
            text,
            level: node.attrs.level || 1,
            pos,
          });
        }
      }
    });
    setOutline(items);
  }, [editor]);

  useEffect(() => {
    updateOutline();
  }, [editor, wordCount, charCount, updateOutline]);

  const activeChannelConfig = CHANNELS.find((c) => c.id === selectedChannel) || CHANNELS[0];
  const channelProgress = Math.min(100, Math.round((charCount / activeChannelConfig.maxChars) * 100));

  const handleJumpToPos = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  };

  const handleInsertTemplate = (htmlContent: string, name: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(htmlContent).run();
    toast.success(`Inserted "${name}" template!`);
  };

  const handleAddHeading = (level: 1 | 2 | 3) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`<h${level}>New Section</h${level}><p></p>`).run();
    toast.success(`Added H${level} heading!`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="hidden md:flex flex-col items-center justify-center w-8 h-full bg-card/60 hover:bg-card border-r border-border/70 text-muted-foreground hover:text-foreground transition-all duration-200 py-4 gap-6 group z-20 shrink-0"
        title="Open Creator Companion Sidebar"
      >
        <div className="p-1 rounded-md bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ChevronRight size={14} />
        </div>
        <span className="[writing-mode:vertical-lr] text-[11px] font-semibold tracking-wider uppercase text-muted-foreground group-hover:text-foreground">
          Companion
        </span>
      </button>
    );
  }

  return (
    <aside className="w-full h-full bg-card border-r border-border/80 flex flex-col select-none overflow-hidden transition-all duration-200 z-20">
      {/* Sidebar Header & Tab Navigation */}
      <div className="border-b border-border/60 bg-muted/20 px-3 pt-3 pb-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              <Compass size={14} />
            </div>
            <span className="font-semibold text-xs text-foreground tracking-tight">Creator Companion</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={15} />
          </Button>
        </div>

        {/* Two Tabs Switcher */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "companion" | "outline")} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-8 p-0.5 bg-muted/60">
            <TabsTrigger value="companion" className="text-xs h-7 gap-1.5 data-[state=active]:bg-background shadow-xs">
              <Sparkles size={12} className="text-primary" />
              <span>Companion</span>
            </TabsTrigger>
            <TabsTrigger value="outline" className="text-xs h-7 gap-1.5 data-[state=active]:bg-background shadow-xs">
              <ListTree size={12} className="text-muted-foreground" />
              <span>Outline</span>
              {outline.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-medium">
                  {outline.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab 1: Companion (Brand Voice, Channels, Frameworks) */}
      {activeTab === "companion" && (
        <ScrollArea className="flex-1 p-3.5 space-y-4">
          {/* 1. Active Brand Voice Card */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Brand Voice</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                Active
              </Badge>
            </div>
            <Card className="border-border/70 bg-gradient-to-br from-card to-muted/30 shadow-none">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-xs text-foreground leading-tight">{activeProfileName}</span>
                  <Sliders size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2.5">
                  Niche: <span className="text-foreground/80 font-medium">{activeNiche}</span>
                </p>
                <div className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-1 rounded-md">
                  <Sparkles size={11} className="shrink-0" />
                  <span>AI is aligned to this persona</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Channel Optimization & Progress Gauge */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Target Channel
            </div>
            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannel === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                        : "bg-muted/30 hover:bg-muted/70 text-muted-foreground border-transparent"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-[10px] truncate max-w-full">
                      {channel.id === "linkedin" ? "LinkedIn" : channel.id === "twitter" ? "X / Thread" : "Newsletter"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground">Character Limit:</span>
                <span className="font-mono font-medium text-foreground">
                  {charCount.toLocaleString()} / {activeChannelConfig.maxChars.toLocaleString()}
                </span>
              </div>
              <Progress value={channelProgress} className="h-1.5" />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{wordCount} words</span>
                <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
              </div>
            </div>
          </div>

          {/* 3. Quick Content Frameworks */}
          <div className="mb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <PlusCircle size={13} />
              <span>Insert Framework</span>
            </div>

            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => handleInsertTemplate(tmpl.content, tmpl.name)}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground group-hover:text-primary mb-0.5">
                    <span>{tmpl.name}</span>
                    <PlusCircle size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Tab 2: Document Outline */}
      {activeTab === "outline" && (
        <ScrollArea className="flex-1 p-3.5 space-y-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <AlignLeft size={13} />
              <span>Table of Contents</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {outline.length} {outline.length === 1 ? "section" : "sections"}
            </span>
          </div>

          {/* Outline Items List */}
          {outline.length > 0 ? (
            <div className="space-y-1 bg-muted/10 rounded-lg p-1.5 border border-border/60 mb-4">
              {outline.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleJumpToPos(item.pos)}
                  style={{ paddingLeft: `${(item.level - 1) * 10 + 6}px` }}
                  className="w-full text-left py-1.5 pr-2 rounded-md hover:bg-muted/70 text-xs text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-mono font-semibold uppercase shrink-0 ${
                      item.level === 1
                        ? "bg-primary/15 text-primary"
                        : item.level === 2
                        ? "bg-muted text-muted-foreground group-hover:text-foreground"
                        : "bg-transparent text-muted-foreground/70"
                    }`}
                  >
                    H{item.level}
                  </span>
                  <span className={`truncate ${item.level === 1 ? "font-medium text-foreground" : "text-foreground/85"}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border/80 text-center text-muted-foreground text-xs mb-4">
              <FileText size={20} className="mx-auto mb-2 opacity-50 text-muted-foreground" />
              <p className="font-medium text-foreground mb-1">No Headings Found</p>
              <p className="text-[11px] text-muted-foreground">
                Add Headings (H1, H2, H3) to your document to generate a structured outline.
              </p>
            </div>
          )}

          {/* Quick Insert Heading Helpers */}
          <div className="pt-2 border-t border-border/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <PlusCircle size={12} />
              <span>Add Heading</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddHeading(1)}
                className="h-8 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Heading1 size={13} />
                <span>H1</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddHeading(2)}
                className="h-8 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Heading2 size={13} />
                <span>H2</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddHeading(3)}
                className="h-8 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Heading3 size={13} />
                <span>H3</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}

