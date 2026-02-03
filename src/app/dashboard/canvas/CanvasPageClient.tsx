"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES, CATEGORIES } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Loader2, Eye, Download, FileText, FileCode, FileType, Save, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    getCanvasDataAction,
    addCanvasBlockAction,
    updateCanvasBlockAction,
    deleteCanvasBlockAction,
    clearCanvasAction,
    saveToIdeasAction,
    addEdgeAction,
    deleteEdgeAction
} from "@/lib/dashboardServerActions";

import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode, { BlockData } from "@/components/dashboard/canvas/CustomNode";

const nodeTypes = {
    custom: CustomNode,
};

interface CanvasPageClientProps {
    activeProfile: Profile | null;
}

export function CanvasPageClient({ activeProfile }: CanvasPageClientProps) {
    const searchParams = useSearchParams();

    // React Flow State
    const [nodes, setNodes, onNodesChangeState] = useNodesState<Node<BlockData>>([]);
    const [edges, setEdges, onEdgesChangeState] = useEdgesState<Edge>([]);

    const [loading, setLoading] = useState(true);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [expandingBlockId, setExpandingBlockId] = useState<string | null>(null);
    const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);
    const [pageTitle, setPageTitle] = useState(searchParams.get("title") || "My New Article");
    const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>(CONTENT_TYPES[0]?.id || 'linkedin_post');
    const [showPreview, setShowPreview] = useState(false);

    const saveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const positionSaveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        fetchBlocks();
    }, []);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const { blocks: fetchedBlocks, edges: fetchedEdges } = await getCanvasDataAction();

            // Check if we need initial layout (if all are at 0,0)
            const needsLayout = fetchedBlocks.length > 1 && fetchedBlocks.every(b => b.position.x === 0 && b.position.y === 0);

            const initialNodes = fetchedBlocks.map((block: any, index: number) => ({
                id: block.id,
                type: 'custom',
                position: needsLayout ? { x: 250, y: index * 300 } : block.position,
                dragHandle: '.drag-handle',
                data: {
                    id: block.id,
                    type: block.type || "paragraph",
                    content: block.content,
                    order: block.order, // Keep for reference
                    onUpdate: handleUpdateBlock,
                    onExpand: handleExpandWithAI,
                    onRegenerate: handleRegenerateBlock,
                    isEditing: false, // Will be managed by local state/context if needed, or derived
                    isExpanding: false,
                    isRegenerating: false,
                    setEditingId: setEditingBlockId
                }
            }));

            // Hydrate extra state for UI (loading spinners)
            // We pass the *current* state values to the node data. 
            // NOTE: Since nodes are state, we need to update them when expandingBlockId etc changes.
            // This is handled by a separate effect or by updating nodes when those states change.

            setNodes(initialNodes);
            setEdges(fetchedEdges || []);
        } catch (error) {
            console.error("Error fetching canvas blocks:", error);
            toast.error("Failed to load canvas");
        } finally {
            setLoading(false);
        }
    };

    // Update node data when loading states change
    useEffect(() => {
        setNodes((nds) => nds.map((node) => ({
            ...node,
            data: {
                ...node.data,
                isEditing: node.id === editingBlockId,
                isExpanding: node.id === expandingBlockId,
                isRegenerating: node.id === regeneratingBlockId,
                setEditingId: setEditingBlockId
            }
        })));
    }, [editingBlockId, expandingBlockId, regeneratingBlockId, setNodes]);


    const onNodesChange = useCallback(
        (changes: NodeChange<Node<BlockData>>[]) => {
            onNodesChangeState(changes);

            // Handle position updates
            changes.forEach((change) => {
                if (change.type === 'position' && change.dragging) {
                    // Debounce save
                    const node = nodes.find(n => n.id === change.id); // This might be stale during drag, but good enough for ID?
                    // Actually `change` has the ID.
                    if (change.position) {
                        const id = change.id;
                        if (positionSaveTimeouts.current[id]) {
                            clearTimeout(positionSaveTimeouts.current[id]);
                        }
                        positionSaveTimeouts.current[id] = setTimeout(() => {
                            // We need to get the latest position from the node state, 
                            // but inside this timeout `nodes` might be stale if we don't use functional update or ref.
                            // Better to trust the resize/drag end event, but `change.position` is partial.
                            // Simplest: just trigger an update with the new position if we know it.
                            // But ReactFlow handles state. We just sync to DB.

                            // Let's rely on the latest node state *at the time of save*.
                            // But we can't access it easily without a ref.
                            // For now, let's just assume the user stops dragging eventually.
                            // We should probably use `onNodeDragStop` instead for DB sync.
                        }, 1000);
                    }
                }
            });
        },
        [onNodesChangeState, nodes]
    );

    const onNodeDragStop = useCallback((event: any, node: Node) => {
        updateCanvasBlockAction(node.id, {
            position: { x: node.position.x, y: node.position.y }
        }).catch(err => console.error("Failed to save position", err));
    }, []);

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChangeState(changes);
            changes.forEach(change => {
                if (change.type === 'remove') {
                    deleteEdgeAction(change.id).catch(err => console.error("Failed to delete edge", err));
                }
            });
        },
        [onEdgesChangeState]
    );

    const onConnect = useCallback(
        async (params: Connection) => {
            if (!params.source || !params.target) return;

            // Optimistic update
            setEdges((eds) => addEdge(params, eds));

            try {
                await addEdgeAction({
                    source: params.source,
                    target: params.target
                });
            } catch (error) {
                console.error("Failed to create edge", error);
                toast.error("Failed to connect nodes");
                // Revert? (Complex without ID)
            }
        },
        [setEdges]
    );

    const handleAddBlock = async () => {
        try {
            // Position: Center of viewport or relative to last node?
            // For now: offset from last node or default 100,100
            const lastNode = nodes[nodes.length - 1];
            const position = lastNode ? { x: lastNode.position.x, y: lastNode.position.y + 350 } : { x: 250, y: 100 };

            const newBlock = {
                type: "paragraph",
                content: "",
                order: nodes.length,
                position
            };

            const addedBlock = await addCanvasBlockAction(newBlock);

            const newNode: Node<BlockData> = {
                id: addedBlock.id,
                type: 'custom',
                position: addedBlock.position,
                dragHandle: '.drag-handle',
                data: {
                    id: addedBlock.id,
                    type: addedBlock.type || "paragraph",
                    content: addedBlock.content || "",
                    order: addedBlock.order_index,
                    title: undefined,
                    onUpdate: handleUpdateBlock,
                    onExpand: handleExpandWithAI,
                    onRegenerate: handleRegenerateBlock,
                    isEditing: false,
                    isExpanding: false,
                    isRegenerating: false,
                    setEditingId: setEditingBlockId
                }
            };

            setNodes((nds) => [...nds, newNode]);
            toast.success("Block added");
        } catch (error) {
            console.error("Error adding block:", error);
            toast.error("Failed to add block");
        }
    };

    const handleUpdateBlock = async (id: string, updates: any) => {
        // Optimistic update
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, ...updates }
                };
            }
            return node;
        }));

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

    // Deleting handled by selecting node + Backspace (React Flow default).
    // But we need to listen to onNodesDelete to remove from DB.
    const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
        for (const node of deletedNodes) {
            try {
                await deleteCanvasBlockAction(node.id);
                toast.success("Block deleted");
            } catch (error) {
                console.error("Error deleting block:", error);
                toast.error("Failed to delete block");
            }
        }
    }, []);


    const handleClearCanvas = async () => {
        if (!confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) return;

        try {
            setLoading(true);
            await clearCanvasAction();
            setNodes([]);
            setEdges([]);
            toast.success("Canvas cleared");
        } catch (error) {
            console.error("Error clearing canvas:", error);
            toast.error("Failed to clear canvas");
        } finally {
            setLoading(false);
        }
    };


    const handleExpandWithAI = async (id: string, content: string, blockType: string) => {
        if (!content?.trim()) {
            toast.error('Please add some content before expanding');
            return;
        }

        try {
            setExpandingBlockId(id);
            // Construct context from all other nodes
            const contextBlocks = nodes
                .filter(n => n.id !== id)
                .map(n => ({ type: n.data.type, content: n.data.content }));

            const response = await fetch('/api/canvas/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_content: content,
                    block_type: blockType,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    contentTypeId: selectedContentTypeId,
                    context_blocks: contextBlocks,
                }),
            });

            if (!response.ok) throw new Error('Failed to expand content');

            const data = await response.json();
            await handleUpdateBlock(id, { content: data.expanded_content });
            toast.success('Content expanded!');
        } catch (error: any) {
            console.error('Error expanding content:', error);
            toast.error(error.message || 'Failed to expand content');
        } finally {
            setExpandingBlockId(null);
        }
    };

    const handleRegenerateBlock = async (id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        const content = node.data.content as string;

        if (!content?.trim()) {
            toast.error('Block content is empty.');
            return;
        }

        try {
            setRegeneratingBlockId(id);
            const contextBlocks = nodes
                .filter(n => n.id !== id)
                .map(n => ({ type: n.data.type, content: n.data.content }));

            const response = await fetch('/api/canvas/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_content: `Rewrite this differently: ${content}`,
                    block_type: node.data.type,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    contentTypeId: selectedContentTypeId,
                    context_blocks: contextBlocks,
                })
            });

            if (!response.ok) throw new Error('Failed to regenerate content');

            const data = await response.json();
            await handleUpdateBlock(id, { content: data.expanded_content });
            toast.success('Content regenerated!');
        } catch (error: any) {
            console.error('Error regenerating content:', error);
            toast.error(error.message || 'Failed to regenerate content');
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
        // Sort nodes by Y position
        const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

        sortedNodes.forEach((node) => {
            const content = (node.data.content as string || '').trim();
            const type = node.data.type as string;
            if (!content) return;

            switch (type) {
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
                    items.forEach((item: string) => {
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

    const handleExport = (format: 'markdown' | 'text') => {
        let content: string;
        let filename: string;
        let mimeType: string;

        // Simple export only support markdown/text for now due to HTML complexity with nodes
        switch (format) {
            case 'markdown':
                content = convertToMarkdown();
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.md`;
                mimeType = 'text/markdown';
                break;
            case 'text':
                content = convertToMarkdown(); // Simplify to same for now, or strip md
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.txt`;
                mimeType = 'text/plain';
                break;
            default:
                return;
        }

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
        <div className="flex flex-col h-[calc(100vh-100px)] w-full">
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-3 mb-4 px-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-2 border-b">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Input
                        className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 w-full md:w-auto min-w-[300px]"
                        type="text"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleClearCanvas} title="Clear all">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSaveCanvasToIdeas}>
                            <Save className="mr-2 h-4 w-4" /> Save Interest
                        </Button>
                        <Button onClick={handleAddBlock} size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Block
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                                    <FileCode className="mr-2 h-4 w-4" /> Markdown
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('text')}>
                                    <FileText className="mr-2 h-4 w-4" /> Text
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {activeProfile && (
                    <span className="text-xs text-muted-foreground">
                        Active Profile: {activeProfile.profile_name}
                    </span>
                )}
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative border rounded-lg shadow-inner">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes as any}
                    fitView
                    className="bg-slate-50 dark:bg-slate-900"
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}
