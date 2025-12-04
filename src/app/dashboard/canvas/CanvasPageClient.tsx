"use client";

import { useState, useEffect, useRef } from "react";
import { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Sparkles, RefreshCw, Trash2, Loader2, GripVertical, Eye, EyeOff, Download, FileText, FileCode, FileType, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    getCanvasDataAction,
    addCanvasBlockAction,
    updateCanvasBlockAction,
    deleteCanvasBlockAction,
    reorderCanvasBlocksAction,
    clearCanvasAction,
    saveToIdeasAction
} from "@/lib/dashboardServerActions";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
import { StrictModeDroppable } from "@/components/StrictModeDroppable"; // We might need to create this or inline it


interface Block {
    id: string;
    type: string;
    content: string;
    order: number;
    title?: string;
}

interface CanvasPageClientProps {
    activeProfile: Profile | null;
}

export function CanvasPageClient({ activeProfile }: CanvasPageClientProps) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [expandingBlockId, setExpandingBlockId] = useState<string | null>(null);
    const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);
    const [pageTitle, setPageTitle] = useState("My New Article");
    const [showPreview, setShowPreview] = useState(false);
    const saveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        fetchBlocks();
    }, []);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const fetchedBlocks = await getCanvasDataAction();
            setBlocks(fetchedBlocks.map((block: any) => ({
                ...block,
                title: block.title || `${block.type} block`,
            })) as Block[]);
        } catch (error) {
            console.error("Error fetching canvas blocks:", error);
            toast.error("Failed to load canvas blocks");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlock = async () => {
        try {
            const newBlock = {
                type: "paragraph",
                content: "",
                order: blocks.length,
            };

            const addedBlock = await addCanvasBlockAction(newBlock);
            setBlocks([...blocks, {
                id: addedBlock.id,
                type: addedBlock.type || "paragraph",
                content: addedBlock.content,
                order: addedBlock.order_index,
                title: "New Block",
            }]);
            setEditingBlockId(addedBlock.id);
            toast.success("Block added");
        } catch (error) {
            console.error("Error adding block:", error);
            toast.error("Failed to add block");
        }
    };

    const handleUpdateBlock = (id: string, updates: Partial<Block>) => {
        // Optimistic update
        setBlocks(prevBlocks => prevBlocks.map(block =>
            block.id === id ? { ...block, ...updates } : block
        ));

        // Debounce content updates
        if (updates.content !== undefined) {
            if (saveTimeouts.current[id]) {
                clearTimeout(saveTimeouts.current[id]);
            }

            saveTimeouts.current[id] = setTimeout(async () => {
                try {
                    await updateCanvasBlockAction(id, { content: updates.content });
                } catch (error) {
                    console.error("Error auto-saving block:", error);
                    toast.error("Failed to auto-save");
                }
                delete saveTimeouts.current[id];
            }, 1000);
        }

        // Immediate update for other fields (like type)
        if (updates.type !== undefined) {
            updateCanvasBlockAction(id, { type: updates.type })
                .catch(error => {
                    console.error("Error updating block type:", error);
                    toast.error("Failed to update block type");
                });
        }
    };

    const handleDeleteBlock = async (id: string) => {
        try {
            await deleteCanvasBlockAction(id);
            setBlocks(blocks.filter(block => block.id !== id));
            toast.success("Block deleted");
        } catch (error) {
            console.error("Error deleting block:", error);
            toast.error("Failed to delete block");
        }
    };

    const handleClearCanvas = async () => {
        if (!confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) return;

        try {
            setLoading(true);
            await clearCanvasAction();
            setBlocks([]);
            toast.success("Canvas cleared");
        } catch (error) {
            console.error("Error clearing canvas:", error);
            toast.error("Failed to clear canvas");
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(blocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update state immediately
        const updatedBlocks = items.map((block, index) => ({
            ...block,
            order: index
        }));
        setBlocks(updatedBlocks);

        // Persist to server
        try {
            await reorderCanvasBlocksAction(updatedBlocks.map(b => ({ id: b.id, order: b.order })));
        } catch (error) {
            console.error("Error reordering blocks:", error);
            toast.error("Failed to save new order");
        }
    };

    const handleExpandWithAI = async (id: string, content: string, blockType: string) => {
        if (!content?.trim()) {
            toast.error('Please add some content before expanding');
            return;
        }

        try {
            setExpandingBlockId(id);
            const response = await fetch('/api/canvas/expand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    block_content: content,
                    block_type: blockType,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    context_blocks: blocks
                        .filter(b => b.id !== id) // Exclude current block
                        .map(b => ({ type: b.type, content: b.content })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to expand content');
            }

            const data = await response.json();

            // Update the block with expanded content
            await handleUpdateBlock(id, { content: data.expanded_content });
            toast.success('Content expanded successfully!');
        } catch (error: any) {
            console.error('Error expanding content:', error);
            toast.error(error.message || 'Failed to expand content');
        } finally {
            setExpandingBlockId(null);
        }
    };



    const handleRegenerateBlock = async (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        if (!block.content.trim()) {
            toast.error('Block content is empty. Add some text first.');
            return;
        }

        try {
            setRegeneratingBlockId(blockId);

            const response = await fetch('/api/canvas/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_content: `Rewrite this differently while keeping the same meaning: ${block.content}`,
                    block_type: block.type,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    context_blocks: blocks
                        .filter(b => b.id !== blockId) // Exclude current block
                        .map(b => ({ type: b.type, content: b.content })),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to regenerate content');
            }

            const data = await response.json();
            await handleUpdateBlock(blockId, { content: data.expanded_content });
            toast.success('Content regenerated!');
        } catch (error: any) {
            console.error('Error regenerating content:', error);
            toast.error(error.message || 'Failed to regenerate content');
        } finally {
            setRegeneratingBlockId(null);
        }
    };

    const handleGenerateBlock = async (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        try {
            setRegeneratingBlockId(blockId); // Reuse regenerating state for loading spinner

            const response = await fetch('/api/canvas/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_type: block.type,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    context_blocks: blocks
                        .filter(b => b.id !== blockId) // Exclude current block
                        .map(b => ({ type: b.type, content: b.content })),
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate content');
            }

            const data = await response.json();
            await handleUpdateBlock(blockId, { content: data.generated_content });
            toast.success('Content generated!');
        } catch (error: any) {
            console.error('Error generating content:', error);
            toast.error(error.message || 'Failed to generate content');
        } finally {
            setRegeneratingBlockId(null);
        }
    };

    const handleSaveCanvasToIdeas = async () => {
        const content = convertToMarkdown();
        if (!content.trim()) {
            toast.error("Canvas is empty");
            return;
        }

        try {
            await saveToIdeasAction(content, pageTitle || "Untitled Canvas");
            toast.success("Canvas saved to Ideas!");
        } catch (error) {
            console.error("Error saving canvas to ideas:", error);
            toast.error("Failed to save canvas to ideas");
        }
    };

    const convertToMarkdown = (): string => {
        let markdown = `# ${pageTitle}\n\n`;

        blocks.forEach((block) => {
            const content = block.content.trim();
            if (!content) return;

            switch (block.type) {
                case "heading":
                    markdown += `## ${content}\n\n`;
                    break;
                case "hook":
                    markdown += `> **Hook:** ${content}\n\n`;
                    break;
                case "problem":
                    markdown += `### Problem\n\n${content}\n\n`;
                    break;
                case "solution":
                    markdown += `### Solution\n\n${content}\n\n`;
                    break;
                case "call-to-action":
                    markdown += `---\n\n**${content}**\n\n`;
                    break;
                case "quote":
                    markdown += `> ${content}\n\n`;
                    break;
                case "list":
                    const items = content.split('\n').filter(i => i.trim());
                    items.forEach(item => {
                        markdown += `- ${item.trim()}\n`;
                    });
                    markdown += '\n';
                    break;
                default:
                    markdown += `${content}\n\n`;
            }
        });

        return markdown;
    };

    const convertToHTML = (): string => {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        h2 { font-size: 2rem; margin-top: 2rem; margin-bottom: 1rem; }
        h3 { font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        p { margin-bottom: 1rem; }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #666;
            font-style: italic;
        }
        ul { margin-bottom: 1rem; }
        hr { margin: 2rem 0; border: none; border-top: 2px solid #ddd; }
        .cta { font-weight: bold; font-size: 1.2rem; text-align: center; margin: 2rem 0; }
    </style>
</head>
<body>
    <h1>${pageTitle}</h1>
`;

        blocks.forEach((block) => {
            const content = block.content.trim();
            if (!content) return;

            const escapedContent = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            switch (block.type) {
                case "heading":
                    html += `    <h2>${escapedContent}</h2>\n`;
                    break;
                case "hook":
                    html += `    <blockquote><strong>Hook:</strong> ${escapedContent}</blockquote>\n`;
                    break;
                case "problem":
                    html += `    <h3>Problem</h3>\n    <p>${escapedContent}</p>\n`;
                    break;
                case "solution":
                    html += `    <h3>Solution</h3>\n    <p>${escapedContent}</p>\n`;
                    break;
                case "call-to-action":
                    html += `    <hr>\n    <p class="cta">${escapedContent}</p>\n`;
                    break;
                case "quote":
                    html += `    <blockquote>${escapedContent}</blockquote>\n`;
                    break;
                case "list":
                    const items = content.split('\n').filter(i => i.trim());
                    html += '    <ul>\n';
                    items.forEach(item => {
                        html += `        <li>${item.trim()}</li>\n`;
                    });
                    html += '    </ul>\n';
                    break;
                default:
                    html += `    <p>${escapedContent}</p>\n`;
            }
        });

        html += `</body>
</html>`;
        return html;
    };

    const convertToPlainText = (): string => {
        let text = `${pageTitle}\n${'='.repeat(pageTitle.length)}\n\n`;

        blocks.forEach((block) => {
            const content = block.content.trim();
            if (!content) return;

            switch (block.type) {
                case "heading":
                    text += `\n${content}\n${'-'.repeat(content.length)}\n\n`;
                    break;
                case "hook":
                case "quote":
                    text += `"${content}"\n\n`;
                    break;
                case "problem":
                    text += `PROBLEM:\n${content}\n\n`;
                    break;
                case "solution":
                    text += `SOLUTION:\n${content}\n\n`;
                    break;
                case "call-to-action":
                    text += `\n*** ${content} ***\n\n`;
                    break;
                default:
                    text += `${content}\n\n`;
            }
        });

        return text;
    };

    const handleExport = (format: 'markdown' | 'html' | 'text') => {
        let content: string;
        let filename: string;
        let mimeType: string;

        switch (format) {
            case 'markdown':
                content = convertToMarkdown();
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.md`;
                mimeType = 'text/markdown';
                break;
            case 'html':
                content = convertToHTML();
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
                mimeType = 'text/html';
                break;
            case 'text':
                content = convertToPlainText();
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.txt`;
                mimeType = 'text/plain';
                break;
        }

        // Create blob and download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Exported as ${format.toUpperCase()}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading canvas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 transition-all">
                {/* Page Heading */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <Input
                            className="text-4xl md:text-[72px] font-bold leading-tight bg-transparent border-none py-2 md:py-5 focus-visible:ring-0 focus-visible:ring-offset-0 w-full md:flex-1 h-auto"
                            type="text"
                            value={pageTitle}
                            onChange={(e) => setPageTitle(e.target.value)}
                        />
                        <div className="flex flex-wrap items-center gap-2 pt-1 w-full md:w-auto">
                            {/* Clear Canvas Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearCanvas}
                                className="text-muted-foreground hover:text-destructive"
                                title="Clear all blocks"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Save to Ideas Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveCanvasToIdeas}
                                title="Save entire canvas to Ideas"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save to Ideas
                            </Button>

                            {/* Export Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleExport('markdown')}>
                                        <FileCode className="mr-2 h-4 w-4" />
                                        Markdown (.md)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('html')}>
                                        <FileType className="mr-2 h-4 w-4" />
                                        HTML (.html)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('text')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Plain Text (.txt)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Preview Toggle */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(true)}
                                className="hidden md:flex"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>
                            {/* Mobile Preview Toggle (Icon Only) */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowPreview(true)}
                                className="md:hidden"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-muted-foreground text-sm font-normal leading-normal">
                            Use the canvas below to build your content. Drag blocks to reorder.
                        </p>
                        {activeProfile && (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                Active: {activeProfile.profile_name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Blocks */}
                <div className="flex flex-col gap-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <StrictModeDroppable droppableId="canvas-blocks">
                            {(provided: DroppableProvided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex flex-col gap-4"
                                >
                                    {blocks.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                            <p className="text-muted-foreground mb-4">
                                                No content blocks yet. Add your first block to get started.
                                            </p>
                                            <Button onClick={handleAddBlock}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add First Block
                                            </Button>
                                        </div>
                                    ) : (
                                        blocks.map((block, index) => (
                                            <Draggable key={block.id} draggableId={block.id} index={index}>
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{ ...provided.draggableProps.style }}
                                                        className={`p-4 rounded-lg bg-card border transition-all group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary z-50 bg-background' : ''} ${editingBlockId === block.id
                                                            ? 'ring-2 ring-primary/50 shadow-lg border-primary/50'
                                                            : 'border-border hover:border-primary/50'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            {/* Block Type */}
                                                            <div className="mb-2 flex justify-between items-center">
                                                                <Select
                                                                    value={block.type}
                                                                    onValueChange={(value) => handleUpdateBlock(block.id, { type: value })}
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
                                                                <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                                            </div>

                                                            {/* Block Content */}
                                                            <Textarea
                                                                className="min-h-[100px] text-base mt-1 resize-none"
                                                                value={block.content}
                                                                onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                                                                onFocus={() => setEditingBlockId(block.id)}
                                                                onBlur={() => setEditingBlockId(null)}
                                                                placeholder="Click to add content..."
                                                            />

                                                            {/* Action Buttons */}
                                                            <div className="border-t pt-4 mt-2">
                                                                <div className="flex flex-wrap gap-3 items-center">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-muted-foreground border-secondary/30 hover:bg-secondary/10 hover:text-secondary font-semibold"
                                                                        onClick={() => handleExpandWithAI(block.id, block.content, block.type)}
                                                                        disabled={expandingBlockId === block.id || !block.content?.trim()}
                                                                    >
                                                                        {expandingBlockId === block.id ? (
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
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-muted-foreground hover:text-foreground font-medium"
                                                                        onClick={() => handleRegenerateBlock(block.id)}
                                                                        disabled={regeneratingBlockId === block.id || !block.content?.trim()}
                                                                    >
                                                                        {regeneratingBlockId === block.id ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Regenerating...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                                Regenerate
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-muted-foreground hover:text-foreground font-medium"
                                                                        onClick={() => handleGenerateBlock(block.id)}
                                                                        disabled={regeneratingBlockId === block.id}
                                                                        title="Generate content based on context"
                                                                    >
                                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                                        Generate
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-500/80 hover:text-red-500 font-medium"
                                                                        onClick={() => handleDeleteBlock(block.id)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </DragDropContext>

                    {/* Add Block Button */}
                    <button
                        onClick={handleAddBlock}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span className="font-semibold">Add Block</span>
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Content Preview</DialogTitle>
                        <DialogDescription>
                            Live preview of your content
                        </DialogDescription>
                    </DialogHeader>
                    <div className="prose prose-slate dark:prose-invert max-w-none mt-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {convertToMarkdown()}
                        </ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
