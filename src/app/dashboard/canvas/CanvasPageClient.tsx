"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES, CATEGORIES } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Loader2, Eye, Download, FileText, FileCode, FileType, Save, PlusCircle, Sparkles, X, MessageSquare, Paperclip, Send, ChevronRight, Maximize, Minimize, Search, Calculator, Database, Layout, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getCanvasDataAction,
    addCanvasBlockAction,
    updateCanvasBlockAction,
    deleteCanvasBlockAction,
    clearCanvasAction,
    saveToIdeasAction,
    addEdgeAction,
    deleteEdgeAction,
    addChatMessageAction,
    getGlobalChatMessagesAction,
    updateCanvasChatHistoryAction
} from "@/lib/dashboardServerActions";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

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

// Types are now managed by @ai-sdk/react

interface CanvasPageClientProps {
    activeProfile: Profile | null;
    clerkId: string | null;
}

export function CanvasPageClient({ activeProfile, clerkId }: CanvasPageClientProps) {
    const searchParams = useSearchParams();
    const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));

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
    const [activeCanvasId, setActiveCanvasId] = useState<string | undefined>(searchParams.get('id') || undefined);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [agentStatus, setAgentStatus] = useState<string | null>(null);
    const [modelProvider, setModelProvider] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    const { 
        messages: chatMessages, 
        sendMessage,
        status: chatStatus,
        setMessages: setChatMessages,
        addToolResult
    } = useChat({
        id: `canvas-${activeCanvasId}`,
        transport: new DefaultChatTransport({ 
            api: process.env.NEXT_PUBLIC_FASTAPI_URL || '/api/chat',
            body: {
                canvasId: activeCanvasId || searchParams.get('id') || undefined,
                profile: activeProfile,
                clerkId
            }
        }),
        onFinish: async (event) => {
            if (activeCanvasId) {
                try {
                    await addChatMessageAction(event.message, activeCanvasId);
                } catch (error) {
                    console.error("Failed to save message", error);
                }
            }
        }
    });

    const isChatLoading = chatStatus === 'streaming' || chatStatus === 'submitted';

    // Handle tool invocations automatically
    useEffect(() => {
        const lastMessage = chatMessages[chatMessages.length - 1];
        if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.parts) return;

        const handleTools = async () => {
            const toolParts = lastMessage.parts.filter(p => p.type === 'tool-invocation' || (p as any).type === 'tool-call');
            for (const part of toolParts) {
                const toolInvocation = (part as any).toolInvocation || part;
                if (toolInvocation.state === 'input-available' && toolInvocation.toolName === 'manage_canvas') {
                    setAgentStatus("Managing canvas...");
                    const args = toolInvocation.input || toolInvocation.args;
                    const results = [];
                    const currentCount = nodes.length;

                    for (const action of (args.actions || [])) {
                        try {
                            let data = action.data;
                            if (typeof data === 'string') {
                                try { data = JSON.parse(data); } catch { data = {}; }
                            }
                            data = data || {};

                            const blockId = data.id || action.id || data.blockId || data.nodeId;

                            if (action.action === 'add_node' || action.action === 'create') {
                                const added = await addCanvasBlockAction({
                                    type: data.type || 'paragraph',
                                    content: data.content || '',
                                    order: currentCount + results.length
                                });
                                results.push({ action: 'add_node', status: 'success', data: added });
                            } else if (action.action === 'update_node' || action.action === 'update') {
                                if (blockId) {
                                    await updateCanvasBlockAction(blockId, {
                                        type: data.type,
                                        content: data.content
                                    });
                                    results.push({ action: 'update_node', status: 'success' });
                                } else {
                                    results.push({ action: 'update_node', status: 'error', error: 'Missing block id' });
                                }
                            } else if (action.action === 'delete_node' || action.action === 'delete') {
                                if (blockId) {
                                    await deleteCanvasBlockAction(blockId);
                                    results.push({ action: 'delete_node', status: 'success' });
                                } else {
                                    results.push({ action: 'delete_node', status: 'error', error: 'Missing block id' });
                                }
                            } else {
                                results.push({ action: action.action, status: 'error', error: 'Unknown action' });
                            }
                        } catch (e: any) {
                            console.error("Tool execution failed for action:", action, e);
                            results.push({ action: action.action, status: 'error', error: e.message });
                        }
                    }
                    
                    await fetchBlocks(true);
                    setAgentStatus(null);
                    addToolResult({
                        tool: 'manage_canvas',
                        toolCallId: toolInvocation.toolCallId,
                        output: { status: 'success', results, blocksAdded: results.filter((r: any) => r.status === 'success').length }
                    } as any);
                }
            }
        };

        handleTools();
    }, [chatMessages, addToolResult, nodes.length]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Feature removed as agent-core was deleted
        setModelProvider('local');
    }, []);

    const toggleFullscreen = () => {
        if (!canvasContainerRef.current) return;

        if (!document.fullscreenElement) {
            canvasContainerRef.current.requestFullscreen().catch(err => {
                toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const saveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const positionSaveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        fetchBlocks();
    }, []);

    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isChatOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setSelectedFiles(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    data: base64
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() && selectedFiles.length === 0) return;

        // Persist user message locally before submitting to AI sdk
        if (activeCanvasId) {
            try {
                await addChatMessageAction({
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: chatInput
                }, activeCanvasId);
            } catch (error) {
                console.error("Failed to save user message", error);
            }
        }
        
        // Use the new sendMessage API
        sendMessage({ text: chatInput });
        setChatInput('');
        setSelectedFiles([]);
    };

    const fetchBlocks = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const canvasId = searchParams.get('id') || undefined;
            const { blocks: fetchedBlocks, edges: fetchedEdges, chatHistory: fetchedChatHistory, id: actualCanvasId } = await getCanvasDataAction(canvasId);
            
            // Store the resolved canvas ID so the agent can write to the correct session
            setActiveCanvasId(actualCanvasId);
            
            // Load chat history from the canvas data
            if (!isSilent && fetchedChatHistory && fetchedChatHistory.length > 0) {
                setChatMessages(fetchedChatHistory.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'data' ? 'system' : msg.role as 'user' | 'assistant' | 'system',
                    parts: [{ type: 'text', text: msg.content || '' }],
                    createdAt: new Date(msg.createdAt)
                })));
            }
            
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
                    order: block.order,
                    onUpdate: handleUpdateBlock,
                    onExpand: handleExpandWithAI,
                    onRegenerate: handleRegenerateBlock,
                    isEditing: false,
                    isExpanding: false,
                    isRegenerating: false,
                    setEditingId: setEditingBlockId
                }
            }));

            setNodes(initialNodes);
            setEdges(fetchedEdges || []);
        } catch (error) {
            console.error("Error fetching canvas blocks:", error);
            if (!isSilent) toast.error("Failed to load canvas");
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

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
        },
        [onNodesChangeState]
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
            setEdges((eds) => addEdge(params, eds));
            try {
                await addEdgeAction({
                    source: params.source,
                    target: params.target
                });
            } catch (error) {
                console.error("Failed to create edge", error);
                toast.error("Failed to connect nodes");
            }
        },
        [setEdges]
    );

    const handleAddBlock = async () => {
        try {
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
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, ...updates }
                };
            }
            return node;
        }));
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
        if (updates.type !== undefined) {
            updateCanvasBlockAction(id, { type: updates.type })
                .catch(error => {
                    console.error("Error updating block type:", error);
                    toast.error("Failed to update block type");
                });
        }
    };

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
        console.log(`[AI] Expanding block ${id} (${blockType})`);
        try {
            setExpandingBlockId(id);
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
                    mode: 'expand'
                }),
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to expand content');
            }
            
            const data = await response.json();
            console.log(`[AI] Expansion result:`, data);

            if (data.expanded_content && data.expanded_content.trim() !== content.trim()) {
                await handleUpdateBlock(id, { content: data.expanded_content });
                toast.success('Content expanded!');
            } else {
                console.warn('[AI] Expansion returned identical content');
                toast('AI provided no additional detail for this block.', { icon: 'ℹ️' });
            }
        } catch (error: any) {
            console.error('[AI] Error expanding content:', error);
            toast.error(error.message || 'Failed to expand content');
        } finally {
            setExpandingBlockId(null);
        }
    };

    const handleRegenerateBlock = async (id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) {
            console.error(`[AI] Regenerate: Node ${id} not found`);
            return;
        }
        const content = node.data.content as string;
        if (!content?.trim()) {
            toast.error('Block content is empty.');
            return;
        }
        console.log(`[AI] Regenerating block ${id}`);
        try {
            setRegeneratingBlockId(id);
            const contextBlocks = nodes
                .filter(n => n.id !== id)
                .map(n => ({ type: n.data.type, content: n.data.content }));

            const response = await fetch('/api/canvas/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_content: content,
                    block_type: node.data.type,
                    canvas_title: pageTitle,
                    active_profile: activeProfile,
                    contentTypeId: selectedContentTypeId,
                    context_blocks: contextBlocks,
                    mode: 'regenerate'
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to regenerate content');
            }

            const data = await response.json();
            console.log(`[AI] Regeneration result:`, data);

            if (data.expanded_content && data.expanded_content.trim() !== content.trim()) {
                await handleUpdateBlock(id, { content: data.expanded_content });
                toast.success('Content regenerated!');
            } else {
                console.warn('[AI] Regeneration returned identical content');
                toast('AI returned identical content.', { icon: 'ℹ️' });
            }
        } catch (error: any) {
            console.error('[AI] Error regenerating content:', error);
            toast.error(error.message || 'Failed to regenerate content');
        } finally {
            setRegeneratingBlockId(null);
        }
    };

    const handleClearChat = async () => {
        setChatMessages([]);
        try {
            const canvasId = searchParams.get('id') || undefined;
            if (canvasId) {
                await updateCanvasChatHistoryAction([], canvasId);
            }
            toast.success("Chat history cleared");
        } catch (error) {
            console.error("Failed to clear chat history:", error);
            toast.error("Failed to clear chat history");
        }
    };

    // Persistence is handled by onFinish and handleSendMessage now

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
        switch (format) {
            case 'markdown':
                content = convertToMarkdown();
                filename = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}.md`;
                mimeType = 'text/markdown';
                break;
            case 'text':
                content = convertToMarkdown();
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
            <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar Skeleton */}
                    <div className="w-80 border-r bg-muted/5 flex flex-col p-4 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-32" />
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Canvas/Center Skeleton */}
                    <div className="flex-1 relative bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel Skeleton */}
                    <div className="w-96 border-l bg-background flex flex-col">
                        <div className="p-4 border-b">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="flex-1 p-4 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={canvasContainerRef} className={`flex flex-col w-full relative overflow-hidden bg-background ${isFullscreen ? 'h-screen p-4' : 'h-[calc(100vh-100px)]'}`}>
            <div className="flex flex-col gap-2 mb-4 px-2 md:px-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-2 border-b">
                <div className="flex items-center justify-between gap-2">
                    <Input
                        className="text-lg md:text-2xl font-bold bg-transparent border-none focus-visible:ring-0 w-full md:w-auto min-w-0 md:min-w-[300px] font-space-grotesk h-auto py-1 px-1"
                        type="text"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                            {isFullscreen ? <Minimize className="h-4 w-4 text-muted-foreground" /> : <Maximize className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" title="Clear all">
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                                className="max-w-sm"
                                container={isFullscreen ? canvasContainerRef.current : undefined}
                            >
                                <AlertDialogHeader>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                            <Trash2 className="h-5 w-5 text-destructive" />
                                        </div>
                                        <AlertDialogTitle className="text-base">Clear Canvas?</AlertDialogTitle>
                                    </div>
                                    <AlertDialogDescription className="text-sm leading-relaxed">
                                        This will permanently delete all content blocks and connections on your canvas. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-2">
                                    <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={handleClearCanvas}
                                    >
                                        Clear Canvas
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleSaveCanvasToIdeas}>
                            <Save className="mr-2 h-4 w-4" /> Save Interest
                        </Button>
                        <Button variant="outline" size="icon" className="flex md:hidden h-8 w-8" onClick={handleSaveCanvasToIdeas} title="Save Interest">
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleAddBlock} size="sm" className="hidden md:flex">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Block
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden sm:flex">
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="flex sm:hidden h-8 w-8">
                                    <Download className="h-4 w-4" />
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
                    <span className="text-[10px] md:text-xs text-muted-foreground px-1">
                        Active Profile: <span className="font-medium">{activeProfile.profile_name}</span>
                    </span>
                )}
            </div>
            
            <div className="flex-1 flex overflow-hidden gap-2">
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
                        preventScrolling={false}
                        className="bg-slate-50 dark:bg-slate-900"
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>

                <div className={`transition-all duration-300 ease-in-out border rounded-lg bg-background flex flex-col shadow-lg overflow-hidden ${isChatOpen ? 'w-[350px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                    <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-orange-600" />
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-sm">AI Creative Assistant</h3>
                                {modelProvider && (
                                    <span className="text-[9px] text-muted-foreground leading-none flex items-center gap-1">
                                        Powered by <span className="font-medium text-orange-600/80 uppercase tracking-tighter">{modelProvider}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Clear Chat">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                    className="max-w-sm"
                                    container={isFullscreen ? canvasContainerRef.current : undefined}
                                >
                                    <AlertDialogHeader>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                                <Trash2 className="h-5 w-5 text-destructive" />
                                            </div>
                                            <AlertDialogTitle className="text-base">Clear chat history?</AlertDialogTitle>
                                        </div>
                                        <AlertDialogDescription className="text-sm leading-relaxed">
                                            This will permanently delete all messages in this conversation. The canvas blocks you've already created will not be affected.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-2">
                                        <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleClearChat}
                                        >
                                            Clear History
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsChatOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground px-4">
                                    Ask me to generate a blog post, social media thread, or brainstorm ideas for your canvas.
                                </p>
                            </div>
                        )}
                        {chatMessages.map((msg) => {
                            const textContent = msg.parts?.filter(p => p.type === 'text').map(p => (p as any).text).join('') || '';
                            const toolInvocations = msg.parts?.filter(p => p.type === 'tool-invocation' || (p as any).type === 'tool-call').map(p => (p as any).toolInvocation || p) || [];
                            
                            return (
                            <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'user' && (
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm bg-orange-600 text-white rounded-tr-none shadow-sm`}>
                                        {textContent && <p className="whitespace-pre-wrap">{textContent}</p>}
                                    </div>
                                )}

                                {toolInvocations.length > 0 && (
                                    <div className="w-[85%] space-y-1.5">
                                        {toolInvocations.map((tool: any) => (
                                            <Accordion 
                                                key={tool.toolCallId} 
                                                type="single" 
                                                collapsible 
                                                defaultValue={tool.state !== 'result' ? tool.toolCallId : undefined}
                                                className="w-full"
                                            >
                                                <AccordionItem value={tool.toolCallId} className={`border rounded-lg px-2 overflow-hidden transition-colors ${
                                                    tool.state !== 'result' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-green-500/5 border-green-500/20'
                                                }`}>
                                                    <AccordionTrigger className="py-2 text-[10px] hover:no-underline">
                                                        <div className="flex items-center justify-between w-full pr-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`p-1 rounded ${tool.toolName === 'manage_canvas' ? 'bg-orange-500/10' : 'bg-muted/10'}`}>
                                                                    <Layout className={`h-3 w-3 ${tool.toolName === 'manage_canvas' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                                                                </div>
                                                                <span className="font-bold uppercase tracking-wider text-xs">{tool.toolName.replace(/_/g, ' ')}</span>
                                                                {tool.state !== 'result' && (
                                                                    <span className="text-[9px] text-orange-500 animate-pulse font-medium">Running...</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {tool.state !== 'result' ? <Loader2 className="h-3 w-3 animate-spin text-orange-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-[10px] text-muted-foreground pb-2">
                                                        <div className="space-y-2">
                                                            <div className="bg-background/50 p-2 rounded border border-dashed">
                                                                <p className="text-[9px] font-semibold uppercase opacity-50 mb-1">Inputs</p>
                                                                <pre className="font-mono whitespace-pre-wrap break-all">{JSON.stringify(tool.args, null, 2)}</pre>
                                                            </div>
                                                            {tool.state === 'result' && (
                                                                <div className="p-2 bg-green-500/5 rounded border border-green-500/10">
                                                                    <p className="text-[9px] font-semibold uppercase text-green-600 dark:text-green-400 mb-1">Result</p>
                                                                    <div className="text-foreground/80 font-medium text-[10px]">
                                                                        Completed successfully.
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ))}
                                    </div>
                                )}

                                {msg.role === 'assistant' && textContent && (
                                    <div className="max-w-[85%] rounded-2xl rounded-tl-none p-3 text-sm bg-muted shadow-sm">
                                        <p className="whitespace-pre-wrap">{textContent}</p>
                                    </div>
                                )}
                            </div>
                        )})}
                        {(isChatLoading || agentStatus) && (
                            <div className="flex flex-col gap-1.5 items-start w-full">
                                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-xl border border-orange-500/20 max-w-[95%] w-full">
                                    <Loader2 className="h-3 w-3 animate-spin text-orange-600 shrink-0" />
                                    <span className="text-[10px] font-semibold text-orange-600 flex-1 truncate">{agentStatus || 'Agent is thinking...'}</span>
                                    <span className="flex gap-0.5">
                                        <span className="h-1 w-1 rounded-full bg-orange-500 animate-bounce" style={{animationDelay:'0ms'}} />
                                        <span className="h-1 w-1 rounded-full bg-orange-500 animate-bounce" style={{animationDelay:'150ms'}} />
                                        <span className="h-1 w-1 rounded-full bg-orange-500 animate-bounce" style={{animationDelay:'300ms'}} />
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 border-t bg-muted/10">
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="relative group bg-muted rounded px-2 py-1 text-xs pr-6 truncate max-w-[150px]">
                                        {file.name}
                                        <button 
                                            onClick={() => removeFile(i)}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-end gap-2">
                            <div className="flex-1 bg-muted/50 rounded-xl overflow-hidden border focus-within:ring-1 focus-within:ring-orange-600/50 transition-shadow">
                                <textarea
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="How can I help with your content?"
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 max-h-[120px] min-h-[44px] resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="px-2 pb-2 flex items-center justify-between">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileSelect} 
                                        multiple 
                                        className="hidden" 
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        className="h-8 w-8 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                                        onClick={handleSendMessage}
                                        disabled={isChatLoading || (!chatInput.trim() && selectedFiles.length === 0)}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`absolute bottom-6 transition-all duration-300 z-50 flex flex-col gap-3 ${isChatOpen ? 'right-[370px]' : 'right-6'}`}>
                <Button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
                        isChatOpen ? 'bg-background text-foreground border' : 'bg-orange-600 text-white'
                    }`}
                    size="icon"
                >
                    {isChatOpen ? <ChevronRight className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                </Button>
                <Button
                    onClick={handleAddBlock}
                    className="md:hidden h-14 w-14 rounded-full shadow-2xl bg-slate-800 hover:bg-slate-900 text-white border-none flex items-center justify-center"
                    size="icon"
                >
                    <PlusCircle className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
}
