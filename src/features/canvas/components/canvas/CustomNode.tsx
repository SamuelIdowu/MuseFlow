"use client";

import { memo, useState, useMemo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GripVertical,
  Sparkles,
  Loader2,
  Trash2,
  Check,
  Edit3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface BlockData extends Record<string, unknown> {
  id: string;
  type: string;
  content: string;
  order: number;
  title?: string;
  // Handlers
  onUpdate: (id: string, updates: any) => void;
  onExpand: (id: string, content: string, type: string) => void;
  onRegenerate: (id: string) => void;
  onDelete?: (id: string) => void;
  isEditing: boolean;
  isExpanding: boolean;
  isRegenerating: boolean;
  setEditingId: (id: string | null) => void;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  hook: {
    label: "Hook",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  prompt: {
    label: "Prompt / Context",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    dotClass: "bg-sky-500",
  },
  variant: {
    label: "Variation",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    dotClass: "bg-cyan-500",
  },
  problem: {
    label: "Problem",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-500",
  },
  solution: {
    label: "Solution",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  "call-to-action": {
    label: "Call to Action",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-500",
  },
  heading: {
    label: "Heading",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  quote: {
    label: "Quote",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    dotClass: "bg-teal-500",
  },
  list: {
    label: "List",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dotClass: "bg-violet-500",
  },
  paragraph: {
    label: "Paragraph",
    badgeClass: "bg-muted/80 text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

const CustomNode = ({ data, selected }: NodeProps<Node<BlockData>>) => {
  const {
    id,
    type,
    content,
    title,
    onUpdate,
    onExpand,
    onRegenerate,
    onDelete,
    isExpanding,
    isRegenerating,
    setEditingId,
  } = data;

  const [isEditingText, setIsEditingText] = useState(false);

  // Auto-extract title if raw markdown starts with **Option ...** or similar
  const { displayTitle, displayContent } = useMemo(() => {
    if (title) {
      return { displayTitle: title, displayContent: content };
    }
    const trimmed = (content || "").trim();
    const firstLineMatch = trimmed.match(
      /^(?:\*{1,2}|_{1,2}|#{1,4}\s+)?((?:Option|Variation|Version|Angle|Strategy|Approach|Idea|Part|Step)\s*#?\d*[:\-–—\s].*?)(?:\*{1,2}|_{1,2})?(?:\n\s*\n+([\s\S]*))?$/i
    );
    if (firstLineMatch) {
      const extracted = firstLineMatch[1].replace(/^[*_~`]+|[*_~`]+$/g, "").trim();
      const rest = firstLineMatch[2] ? firstLineMatch[2].trim() : "";
      return {
        displayTitle: extracted,
        displayContent: rest || trimmed,
      };
    }
    return { displayTitle: undefined, displayContent: content };
  }, [title, content]);

  const currentTypeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.paragraph;

  return (
    <div
      className={`w-[340px] sm:w-[390px] md:w-[410px] rounded-xl bg-card border transition-all duration-200 shadow-md hover:shadow-lg select-text ${
        selected
          ? "ring-2 ring-primary border-primary shadow-primary/10"
          : "border-border/80 hover:border-border"
      }`}
    >
      {/* Target Handles (Left and Top) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background transition-transform hover:scale-125"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background transition-transform hover:scale-125"
      />

      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Header: Type Badge, Drag Handle & Actions */}
        <div className="flex items-center justify-between gap-2 drag-handle cursor-grab active:cursor-grabbing pb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${currentTypeConfig.dotClass}`} />
            <Select
              value={type}
              onValueChange={(val) => onUpdate(id, { type: val })}
            >
              <SelectTrigger
                className={`h-6 px-2 text-[11px] font-bold uppercase tracking-wider border rounded-md shadow-2xs ${currentTypeConfig.badgeClass} focus:ring-0`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hook">Hook</SelectItem>
                <SelectItem value="prompt">Prompt / Context</SelectItem>
                <SelectItem value="variant">Variation</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="solution">Solution</SelectItem>
                <SelectItem value="call-to-action">Call to Action</SelectItem>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="heading">Heading</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 shrink-0 nodrag">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted"
              onClick={() => {
                const nextState = !isEditingText;
                setIsEditingText(nextState);
                if (nextState) setEditingId(id);
                else setEditingId(null);
              }}
              title={isEditingText ? "Preview block" : "Edit block text"}
            >
              {isEditingText ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Edit3 className="h-3.5 w-3.5" />
              )}
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(id)}
                title="Delete block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <GripVertical className="h-4 w-4 text-muted-foreground/40 ml-0.5 cursor-grab" />
          </div>
        </div>

        {/* Display Title (if present or extracted) */}
        {displayTitle && (
          <div className="font-semibold text-sm sm:text-[15px] text-foreground tracking-tight leading-snug">
            {displayTitle}
          </div>
        )}

        {/* Content Area */}
        {isExpanding || isRegenerating ? (
          <div className="min-h-[110px] p-3.5 border rounded-lg bg-muted/20 flex flex-col gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="flex items-center gap-2 mt-2 text-xs text-primary font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isExpanding ? "Expanding content with AI..." : "Regenerating content..."}
            </div>
          </div>
        ) : isEditingText ? (
          <div className="space-y-2 nodrag">
            <Textarea
              className="min-h-[110px] text-sm leading-relaxed p-3 bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary rounded-lg resize-y"
              value={content}
              onChange={(e) => onUpdate(id, { content: e.target.value })}
              onFocus={() => setEditingId(id)}
              placeholder="Enter block content..."
              autoFocus
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
                onClick={() => {
                  setIsEditingText(false);
                  setEditingId(null);
                }}
              >
                <Check className="h-3 w-3" /> Done
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setIsEditingText(true);
              setEditingId(id);
            }}
            className="group relative min-h-[90px] p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/60 cursor-pointer transition-all nodrag"
            title="Click anywhere to edit content"
          >
            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-amber-500/70 bg-amber-500/5 dark:bg-amber-950/20 px-3 py-1.5 my-1.5 rounded-r-md text-foreground italic font-medium">
                      {children}
                    </blockquote>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                }}
              >
                {displayContent || "*Empty block (click to edit)*"}
              </ReactMarkdown>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] bg-background/90 text-muted-foreground border border-border px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                <Edit3 className="h-2.5 w-2.5" /> Edit
              </span>
            </div>
          </div>
        )}

        {/* Footer: AI Actions */}
        <div className="border-t border-border/40 pt-3 mt-1 flex items-center justify-between gap-2 nodrag">
          <Button
            variant="default"
            size="sm"
            className="h-7 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-2xs gap-1.5"
            onClick={() => onExpand(id, content, type)}
            disabled={isExpanding || !content?.trim()}
          >
            {isExpanding ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Expanding...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Expand with AI
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
            onClick={() => onRegenerate(id)}
            disabled={isRegenerating || !content?.trim()}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>
      </div>

      {/* Source Handles (Right and Bottom) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-background transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background transition-transform hover:scale-125"
      />
    </div>
  );
};

export default memo(CustomNode);
