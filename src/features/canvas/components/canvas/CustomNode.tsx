
import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Sparkles, Loader2 } from "lucide-react";

// We'll define the Block interface locally for now if not available, or import it.
// The previous file had it inside the component. I should strictly move it to types.
// For now, I'll redefine it here to be safe and refactor later.
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
    isEditing: boolean;
    isExpanding: boolean;
    isRegenerating: boolean;
    setEditingId: (id: string | null) => void;
}

const CustomNode = ({ data, selected }: NodeProps<Node<BlockData>>) => {
    // data should be cast to our specific type, but NodeProps generic is strict.
    const {
        id, type, content,
        onUpdate, onExpand, onRegenerate,
        isEditing, isExpanding, isRegenerating, setEditingId
    } = data;

    return (
        <div className={`w-[320px] sm:w-[380px] md:w-[400px] rounded-lg bg-card border transition-all duration-200 shadow-md ${selected ? 'ring-2 ring-primary/60 border-primary' : 'border-border'}`}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary border-2 border-background" />

            <div className="p-5 flex flex-col gap-2">
                {/* Header: Type and Drag Handle */}
                <div className="mb-2 flex justify-between items-center drag-handle cursor-grab active:cursor-grabbing">
                    <Select
                        value={type}
                        onValueChange={(value) => onUpdate(id, { type: value })}
                    >
                        <SelectTrigger className="w-48 h-8 text-primary font-semibold uppercase text-sm border-none bg-transparent shadow-none focus:ring-0 py-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hook">Hook</SelectItem>
                            <SelectItem value="heading">Heading</SelectItem>
                            <SelectItem value="problem">Problem</SelectItem>
                            <SelectItem value="solution">Solution</SelectItem>
                            <SelectItem value="call-to-action">Call to Action</SelectItem>
                            <SelectItem value="paragraph">Paragraph</SelectItem>
                            <SelectItem value="quote">Quote</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                        </SelectContent>
                    </Select>
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                </div>

                {/* Content Area */}
                {isExpanding || isRegenerating ? (
                    <div className="min-h-[100px] mt-1 p-3 border rounded-md bg-muted/20 flex flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {isExpanding ? "Expanding content..." : "Regenerating content..."}
                        </div>
                    </div>
                ) : (
                    <Textarea
                        className="min-h-[100px] text-base mt-1 resize-y font-mono leading-relaxed nodrag"
                        value={content}
                        onChange={(e) => onUpdate(id, { content: e.target.value })}
                        onFocus={() => setEditingId(id)}
                        onBlur={() => setEditingId(null)}
                        placeholder="Click to add content..."
                    />
                )}

                {/* Footer: AI Actions */}
                <div className="border-t border-border/50 pt-4 mt-2 flex flex-wrap gap-3 items-center">
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                        onClick={() => onExpand(id, content, type)}
                        disabled={isExpanding || !content?.trim()}
                    >
                        {isExpanding ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Expanding...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Expand with AI
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground font-medium"
                        onClick={() => onRegenerate(id)}
                        disabled={isRegenerating || !content?.trim()}
                    >
                        {isRegenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Regenerating...
                            </>
                        ) : (
                            "Regenerate"
                        )}
                    </Button>
                </div>
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-background" />
        </div>
    );
};

export default memo(CustomNode);
