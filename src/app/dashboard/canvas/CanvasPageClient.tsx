"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES, CATEGORIES } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Loader2, Eye, Download, FileText, FileCode, FileType, Save, PlusCircle, Sparkles, X, MessageSquare, Paperclip, Send, ChevronRight, Maximize, Minimize, Search, Calculator, Database, Layout, CheckCircle2, AlertCircle, Info, SquarePen, Layers, Plus, ChevronDown, Check, MoreHorizontal } from "lucide-react";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getCanvasDataAction,
    addCanvasBlockAction,
    updateCanvasBlockAction,
    deleteCanvasBlockAction,
    clearCanvasAction,
    addEdgeAction,
    deleteEdgeAction,
    addChatMessageAction,
    getGlobalChatMessagesAction,
    updateCanvasChatHistoryAction,
    generateCanvasChatResponseAction,
    createCanvasSessionAction,
    getUserCanvasSessionsAction,
    updateCanvasSessionNameAction,
    getCanvasModelProviderAction,
} from "@/features/canvas/actions/canvasActions";
import { saveToIdeasAction, getChatById } from "@/features/ideas/actions/ideaActions";
import { cn } from "@/lib/utils";

import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowInstance,
    CoordinateExtent,
    getNodesBounds,
    getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode, { BlockData } from "@/features/canvas/components/canvas/CustomNode";
import { CanvasZoomToolbar } from "@/features/canvas/components/canvas/CanvasZoomToolbar";

const nodeTypes = {
    custom: CustomNode,
};

interface DecomposedBlock {
    type: string;
    content: string;
    title?: string;
    extractedTitle?: string;
}

function cleanSectionTitle(rawHeader: string): string {
    return rawHeader
        .replace(/^#{1,4}\s+/, '')
        .replace(/^[*_~`]+|[*_~`]+$/g, '')
        .trim();
}

function determineBlockType(headerText: string, bodyPreview: string = ''): string {
    const combined = (headerText + ' ' + bodyPreview).toLowerCase();
    
    // 1. Call to Action / Outro / Next Steps
    if (
        combined.includes('call to action') || 
        combined.includes('call-to-action') || 
        combined.includes('cta') || 
        combined.includes('outro') || 
        combined.includes('drop a comment') || 
        combined.includes('comment below') || 
        combined.includes('follow for') || 
        combined.includes('subscribe') || 
        combined.includes('dm you') || 
        combined.includes('link in bio') ||
        combined.includes('try it now') ||
        combined.includes('sign up')
    ) {
        return 'call-to-action';
    }

    // 2. Hook / Intro / Attention Grabber
    if (
        combined.includes('hook') || 
        combined.includes('intro') || 
        combined.includes('opener') || 
        combined.includes('stop scrolling') || 
        combined.includes('attention') ||
        combined.includes('did you know')
    ) {
        return 'hook';
    }

    // 3. Problem / Pain Point
    if (
        combined.includes('problem') || 
        combined.includes('pain') || 
        combined.includes('challenge') || 
        combined.includes('struggle') || 
        combined.includes('frustrated') || 
        combined.includes('waste') ||
        combined.includes('mistake')
    ) {
        return 'problem';
    }

    // 4. Solution / Tool / Tip / Step / Framework
    if (
        combined.includes('tool') || 
        combined.includes('solution') || 
        combined.includes('tip') || 
        combined.includes('step') || 
        combined.includes('framework') || 
        combined.includes('strategy') || 
        combined.includes('technique') || 
        combined.includes('how to') ||
        combined.includes('secret')
    ) {
        return 'solution';
    }

    // 5. Quote / Testimonial
    if (
        combined.includes('quote') || 
        combined.includes('testimonial') || 
        combined.includes('dialogue') ||
        combined.includes('interview')
    ) {
        return 'quote';
    }

    // 6. List
    if (
        bodyPreview.trim().startsWith('*') || 
        bodyPreview.trim().startsWith('-') || 
        bodyPreview.includes('\n* ') || 
        bodyPreview.includes('\n- ')
    ) {
        return 'list';
    }

    // 7. Heading / Chapter / Act
    if (headerText && !bodyPreview) {
        return 'heading';
    }

    return 'paragraph';
}

function decomposeContentIntoBlocks(rawContent: string, defaultTopic?: string): DecomposedBlock[] {
    const trimmed = (rawContent || '').trim();
    if (!trimmed) return [];

    const lines = trimmed.split('\n');
    let extractedTitle = '';
    const metadata: { key: string; val: string }[] = [];
    let contentStartIdx = 0;

    // Scan for top metadata lines: **Title:**, **Format:**, **Pacing:**, etc.
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            contentStartIdx = i + 1;
            continue;
        }
        const metaMatch = line.match(/^(?:\*{1,2}|_{1,2})?(Title|Format|Pacing|Target Audience|Tone|Duration|Channel|Platform)(?:\*{1,2}|_{1,2})?:\s*(.+)$/i);
        if (metaMatch) {
            const key = metaMatch[1].toLowerCase();
            const val = metaMatch[2].replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
            if (key === 'title' && !extractedTitle) {
                extractedTitle = val;
            }
            metadata.push({ key, val });
            contentStartIdx = i + 1;
        } else {
            break;
        }
    }

    const bodyLines = lines.slice(contentStartIdx);
    const bodyText = bodyLines.join('\n').trim();

    if (!bodyText) {
        return [{
            type: 'paragraph',
            content: trimmed,
            title: extractedTitle || defaultTopic,
            extractedTitle: extractedTitle || defaultTopic
        }];
    }

    // Section header detection regex
    const headerLineRegex = /^(?:#{1,4}\s+|(?:\*{1,2}|_{1,2})?(?:\[\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\]|\(\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\)|(?:Scene|Act|Segment|Part|Step|Tip|Tool|Point)\s*#?\d+|Hook|Problem|Solution|Action|CTA|Call[- ]to[- ]Action|Outro|Intro|Takeaway|Key Takeaway|Summary)(?::|(?:\*{1,2}|_{1,2}))?)/i;

    const rawParagraphs = bodyText.split(/\n\s*\n+/);
    const candidateBlocks: DecomposedBlock[] = [];

    let currentSection = {
        type: 'paragraph',
        header: '',
        lines: [] as string[]
    };

    const flushCurrent = () => {
        if (currentSection.lines.length > 0 || currentSection.header) {
            let content = '';
            if (currentSection.header) {
                content = currentSection.lines.length > 0
                    ? `**${currentSection.header}**\n\n${currentSection.lines.join('\n\n')}`
                    : `**${currentSection.header}**`;
            } else {
                content = currentSection.lines.join('\n\n');
            }

            candidateBlocks.push({
                type: currentSection.type,
                content: content.trim(),
                extractedTitle: extractedTitle || defaultTopic
            });
        }
        currentSection = { type: 'paragraph', header: '', lines: [] };
    };

    for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
        const p = rawParagraphs[pIdx].trim();
        if (!p) continue;

        const pLines = p.split('\n');
        const firstLine = pLines[0].trim();

        const isHeader = headerLineRegex.test(firstLine);

        if (isHeader) {
            flushCurrent();

            const cleanHeader = cleanSectionTitle(firstLine);
            const restOfP = pLines.slice(1).join('\n').trim();
            const bType = determineBlockType(cleanHeader, restOfP);

            currentSection.type = bType;
            currentSection.header = cleanHeader;
            if (restOfP) {
                currentSection.lines.push(restOfP);
            }
        } else {
            // Check if this paragraph is a bulleted list
            const isBulletList = pLines.filter(l => /^\s*[-*•\d+.]\s+/.test(l)).length >= 2 || (pLines.length === 1 && /^\s*[-*•]\s+/.test(pLines[0]));

            if (isBulletList) {
                flushCurrent();
                candidateBlocks.push({
                    type: 'list',
                    content: p,
                    extractedTitle: extractedTitle || defaultTopic
                });
            } else if (currentSection.header) {
                // Check if this paragraph is an outro / CTA
                const ctaType = determineBlockType('', p);
                if (ctaType === 'call-to-action' && currentSection.type !== 'call-to-action') {
                    flushCurrent();
                    candidateBlocks.push({
                        type: 'call-to-action',
                        content: p,
                        extractedTitle: extractedTitle || defaultTopic
                    });
                } else {
                    currentSection.lines.push(p);
                }
            } else {
                // No header yet
                const bType = determineBlockType('', p);
                if (candidateBlocks.length === 0 && pIdx === 0 && p.length < 250) {
                    currentSection.type = 'hook';
                } else {
                    currentSection.type = bType;
                }
                currentSection.lines.push(p);
                flushCurrent();
            }
        }
    }

    flushCurrent();

    // Fallback: If only 1 block was generated but content has multiple paragraphs, split them
    if (candidateBlocks.length <= 1) {
        const paragraphs = bodyText.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
        if (paragraphs.length >= 2) {
            return paragraphs.map((p, idx) => {
                let blockType = determineBlockType('', p);
                if (idx === 0 && blockType === 'paragraph' && p.length < 250) {
                    blockType = 'hook';
                } else if (idx === paragraphs.length - 1 && blockType === 'paragraph' && p.length < 250) {
                    blockType = 'call-to-action';
                }
                return {
                    type: blockType,
                    content: p,
                    extractedTitle: extractedTitle || defaultTopic
                };
            });
        }
    }

    return candidateBlocks.length > 0 ? candidateBlocks : [{
        type: 'paragraph',
        content: trimmed,
        title: extractedTitle || defaultTopic,
        extractedTitle: extractedTitle || defaultTopic
    }];
}

// Types are now managed by @ai-sdk/react

interface CanvasPageClientProps {
    activeProfile: Profile | null;
    clerkId: string | null;
}

export function CanvasPageClient({ activeProfile, clerkId }: CanvasPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionParam = searchParams.get("session") || searchParams.get("id") || searchParams.get("canvasId");
    const isNewParam = searchParams.get("new") === "true";
    const importParam = searchParams.get("import");
    const topicParam = searchParams.get("topic");
    const ideaIdParam = searchParams.get("ideaId");

    const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));

    // React Flow State
    const [nodes, setNodes, onNodesChangeState] = useNodesState<Node<BlockData>>([]);
    const [edges, setEdges, onEdgesChangeState] = useEdgesState<Edge>([]);

    // Finite Canvas Workspace Boundaries (Restricts infinite panning & sets full canvas minimum overview)
    const canvasBounds = useMemo(() => {
        if (!nodes || nodes.length === 0) {
            return {
                x: 0,
                y: 0,
                width: 2200,
                height: 1400,
            };
        }
        const bounds = getNodesBounds(nodes);
        const padX = 240;
        const padY = 180;
        const x = Math.min(0, Math.floor((bounds.x || 0) - padX));
        const y = Math.min(0, Math.floor((bounds.y || 0) - padY));
        const right = Math.max(2200, Math.ceil((bounds.x || 0) + (bounds.width || 0) + padX));
        const bottom = Math.max(1400, Math.ceil((bounds.y || 0) + (bounds.height || 0) + padY));
        return {
            x,
            y,
            width: right - x,
            height: bottom - y,
        };
    }, [nodes]);

    const translateExtent = useMemo<CoordinateExtent>(() => {
        return [
            [canvasBounds.x, canvasBounds.y],
            [canvasBounds.x + canvasBounds.width, canvasBounds.y + canvasBounds.height],
        ];
    }, [canvasBounds]);

    const nodeExtent = useMemo<CoordinateExtent>(() => {
        return [
            [canvasBounds.x + 30, canvasBounds.y + 30],
            [canvasBounds.x + canvasBounds.width - 30, canvasBounds.y + canvasBounds.height - 30],
        ];
    }, [canvasBounds]);

    // Minimum overview zoom factor so that the entire canvas workspace covers the screen
    const minOverviewZoom = useMemo(() => {
        let containerWidth = 1200;
        let containerHeight = 800;
        if (typeof window !== "undefined") {
            const container = document.querySelector(".react-flow") as HTMLElement | null;
            if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                containerWidth = container.clientWidth;
                containerHeight = container.clientHeight;
            } else {
                containerWidth = window.innerWidth * 0.7;
                containerHeight = window.innerHeight * 0.75;
            }
        }
        const vp = getViewportForBounds(
            { x: canvasBounds.x, y: canvasBounds.y, width: canvasBounds.width, height: canvasBounds.height },
            containerWidth,
            containerHeight,
            0.05,
            1.0,
            0.04
        );
        return Math.max(0.08, Math.min(vp.zoom, 1.0));
    }, [canvasBounds]);

    const [loading, setLoading] = useState(true);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [expandingBlockId, setExpandingBlockId] = useState<string | null>(null);
    const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);
    const [pageTitle, setPageTitle] = useState(searchParams.get("title") || searchParams.get("topic") || "My New Article");
    const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>(CONTENT_TYPES[0]?.id || 'linkedin_post');
    const [showPreview, setShowPreview] = useState(false);
    const [activeCanvasId, setActiveCanvasId] = useState<string | undefined>(sessionParam || undefined);
    const [canvasSessions, setCanvasSessions] = useState<{ id: string; name: string; created_at: string; updated_at: string }[]>([]);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [agentStatus, setAgentStatus] = useState<string | null>(null);
    const [modelProvider, setModelProvider] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const loadCanvasSessions = useCallback(async () => {
        try {
            const sessions = await getUserCanvasSessionsAction();
            setCanvasSessions(sessions);
        } catch (err) {
            console.error("Error loading canvas sessions:", err);
        }
    }, []);

    useEffect(() => {
        loadCanvasSessions();
    }, [loadCanvasSessions]);

    const titleDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleTitleChange = (newTitle: string) => {
        setPageTitle(newTitle);
        if (titleDebounceTimer.current) {
            clearTimeout(titleDebounceTimer.current);
        }
        if (activeCanvasId) {
            titleDebounceTimer.current = setTimeout(async () => {
                try {
                    await updateCanvasSessionNameAction(activeCanvasId, newTitle);
                    setCanvasSessions(prev => prev.map(s => s.id === activeCanvasId ? { ...s, name: newTitle } : s));
                } catch (err) {
                    console.error("Failed to update canvas title in database:", err);
                }
            }, 800);
        }
    };

    const handleCreateNewCanvas = async () => {
        try {
            setLoading(true);
            const newSession = await createCanvasSessionAction("New Canvas");
            if (newSession?.id) {
                toast.success("Created new canvas", { icon: "✨" });
                router.push(`/dashboard/canvas?session=${newSession.id}`);
                loadCanvasSessions();
            }
        } catch (err) {
            console.error("Failed to create new canvas:", err);
            toast.error("Could not create new canvas");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchCanvas = (targetSessionId: string) => {
        if (targetSessionId === activeCanvasId) return;
        setNodes([]);
        setEdges([]);
        setLoading(true);
        router.push(`/dashboard/canvas?session=${targetSessionId}`);
    };

    useEffect(() => {
        getCanvasModelProviderAction()
            .then(provider => setModelProvider(provider))
            .catch(() => setModelProvider('gemini'));
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
    const reactFlowInstanceRef = useRef<ReactFlowInstance<Node<BlockData>, Edge> | null>(null);
    const processedImportRef = useRef<string | null>(null);

    useEffect(() => {
        fetchBlocks();
    }, [sessionParam, isNewParam, importParam, topicParam, ideaIdParam]);

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
        const text = chatInput.trim();
        if (!text && selectedFiles.length === 0) return;

        const userMsg = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: text,
            parts: [{ type: 'text', text }]
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        const filesToSend = [...selectedFiles];
        setSelectedFiles([]);
        setIsChatLoading(true);
        setAgentStatus("Thinking...");

        // Persist user message to Supabase
        if (activeCanvasId) {
            try {
                await addChatMessageAction(userMsg, activeCanvasId);
            } catch (error) {
                console.error("Failed to save user message", error);
            }
        }

        try {
            // Build current canvas context
            const currentCanvas = {
                blocks: nodes.map(n => ({ id: n.id, type: n.data?.type || 'paragraph', content: n.data?.content || '' })),
                edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
            };

            const historyFormatted = chatMessages.map(m => ({
                role: m.role,
                content: m.content || (m.parts?.[0]?.text) || ''
            }));

            const response = await generateCanvasChatResponseAction(
                text,
                historyFormatted,
                filesToSend.map(f => ({ data: f.data, mimeType: f.type })),
                currentCanvas
            );

            let replyMessage = "";
            let generatedBlocks: any[] = [];

            if (typeof response === "string") {
                replyMessage = response;
            } else if (response) {
                replyMessage = response.message || (response as any).content || "";
                generatedBlocks = response.blocks || [];
                if ((response as any).source === 'research_agent') {
                    setModelProvider('research agent');
                } else if ((response as any).source === 'gemini') {
                    setModelProvider('gemini');
                }
            }

            // Create newly generated blocks if any
            if (generatedBlocks && generatedBlocks.length > 0) {
                setAgentStatus("Applying blocks to canvas...");
                for (let i = 0; i < generatedBlocks.length; i++) {
                    const blk = generatedBlocks[i];
                    await addCanvasBlockAction({
                        type: blk.type || 'paragraph',
                        content: blk.content || '',
                        order: nodes.length + i,
                        position: blk.position
                    }, activeCanvasId);
                }
                await fetchBlocks(true);
            }

            const assistantMsg = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: replyMessage,
                parts: [{ type: 'text', text: replyMessage }]
            };

            setChatMessages(prev => [...prev, assistantMsg]);

            if (activeCanvasId) {
                try {
                    await addChatMessageAction(assistantMsg, activeCanvasId);
                } catch (error) {
                    console.error("Failed to save assistant message", error);
                }
            }
        } catch (error: any) {
            console.error("Canvas AI Error:", error);
            toast.error("Failed to generate AI response");
            setChatMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant' as const,
                    content: "Sorry, I ran into an issue connecting to the AI model. Please try again.",
                    parts: [{ type: 'text', text: "Sorry, I ran into an issue connecting to the AI model. Please try again." }]
                }
            ]);
        } finally {
            setIsChatLoading(false);
            setAgentStatus(null);
        }
    };

    const applyImportPayload = useCallback(async (
        parsed: any, 
        existingNodesList?: Node<BlockData>[], 
        targetCanvasId?: string
    ) => {
        if (!parsed || (!parsed.content && !parsed.topic)) return false;

        const contentToInsert = parsed.content || parsed.topic || '';
        const topicTitle = parsed.topic || parsed.title;

        const decomposed = decomposeContentIntoBlocks(contentToInsert, topicTitle);
        if (decomposed.length === 0) return false;

        const effectiveTitle = decomposed[0]?.extractedTitle || topicTitle || "Imported Canvas";
        setPageTitle(effectiveTitle);

        const resolvedCanvasId = targetCanvasId || activeCanvasId || searchParams.get('session') || searchParams.get('id') || undefined;
        if (resolvedCanvasId) {
            updateCanvasSessionNameAction(resolvedCanvasId, effectiveTitle).catch(console.error);
            setCanvasSessions(prev => prev.map(s => s.id === resolvedCanvasId ? { ...s, name: effectiveTitle } : s));
        }

        // Dedicated import layout: 3 columns, clean grid
        const startX = 80;
        const startY = 120;
        const colWidth = 440;
        const rowHeight = 360;

        const newNodes: Node<BlockData>[] = [];
        const newEdges: Edge[] = [];
        const tempBlockMap: { tempId: string; block: DecomposedBlock; index: number; position: { x: number; y: number } }[] = [];

        decomposed.forEach((block, idx) => {
            const tempId = `imported_${Date.now()}_${idx}`;
            const x = startX + (idx % 3) * colWidth;
            const y = startY + Math.floor(idx / 3) * rowHeight;
            const position = { x, y };

            const node: Node<BlockData> = {
                id: tempId,
                type: 'custom',
                position,
                dragHandle: '.drag-handle',
                data: {
                    id: tempId,
                    type: block.type,
                    content: block.content,
                    order: idx,
                    onUpdate: handleUpdateBlock,
                    onExpand: handleExpandWithAI,
                    onRegenerate: handleRegenerateBlock,
                    isEditing: false,
                    isExpanding: false,
                    isRegenerating: false,
                    setEditingId: setEditingBlockId
                }
            };
            newNodes.push(node);
            tempBlockMap.push({ tempId, block, index: idx, position });

            if (idx > 0) {
                const prevTempId = tempBlockMap[idx - 1]?.tempId;
                if (prevTempId) {
                    newEdges.push({
                        id: `edge_${prevTempId}_${tempId}`,
                        source: prevTempId,
                        target: tempId,
                        animated: true,
                        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
                    });
                }
            }
        });

        // Set ONLY the imported nodes on the canvas
        setNodes(newNodes);
        setEdges(newEdges);

        toast.success(
            decomposed.length > 1 
                ? `Imported ${decomposed.length} visual nodes into new Canvas!` 
                : "Imported idea into Canvas!", 
            { icon: "🎨" }
        );

        setTimeout(() => {
            reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 500 });
        }, 150);

        try {
            const savedRealIds: string[] = [];
            for (const item of tempBlockMap) {
                try {
                    const addedBlock = await addCanvasBlockAction({
                        type: item.block.type,
                        content: item.block.content,
                        order: item.index,
                        position: item.position
                    }, resolvedCanvasId);

                    if (addedBlock?.id) {
                        savedRealIds[item.index] = addedBlock.id;
                        setNodes(nds => nds.map(n => n.id === item.tempId ? {
                            ...n,
                            id: addedBlock.id,
                            data: { ...n.data, id: addedBlock.id }
                        } : n));
                    }
                } catch (err) {
                    console.warn(`Could not save imported block ${item.index} to DB:`, err);
                }
            }

            for (let i = 1; i < savedRealIds.length; i++) {
                const srcId = savedRealIds[i - 1];
                const tgtId = savedRealIds[i];
                if (srcId && tgtId) {
                    const prevTempId = tempBlockMap[i - 1]?.tempId;
                    const currTempId = tempBlockMap[i]?.tempId;
                    try {
                        const savedEdge = await addEdgeAction({
                            source: srcId,
                            target: tgtId
                        });
                        if (savedEdge?.id) {
                            setEdges(eds => eds.map(e => (e.source === prevTempId && e.target === currTempId) ? {
                                ...e,
                                id: savedEdge.id,
                                source: srcId,
                                target: tgtId
                            } : e));
                        }
                    } catch (edgeErr) {
                        console.warn("Could not save connecting edge to DB:", edgeErr);
                    }
                }
            }
        } catch (dbErr) {
            console.error("Error saving imported canvas nodes to DB:", dbErr);
        }

        return true;
    }, [activeCanvasId, searchParams, nodes]);

    const handleLoadLatestDashboardChat = async () => {
        try {
            const raw = localStorage.getItem('museflow_canvas_import') || localStorage.getItem('museflow_latest_ai_chat');
            if (!raw) {
                toast.error("No recent AI chat draft found in storage.");
                return;
            }
            const parsed = JSON.parse(raw);
            let targetSessionId = activeCanvasId;
            // If current canvas already has nodes, create a brand-new canvas for the import
            if (nodes.length > 0) {
                const topicTitle = parsed.topic || parsed.title || "Imported Canvas";
                const newSession = await createCanvasSessionAction(topicTitle);
                if (newSession?.id) {
                    targetSessionId = newSession.id;
                    setActiveCanvasId(newSession.id);
                    loadCanvasSessions();
                    window.history.replaceState(null, '', `/dashboard/canvas?session=${newSession.id}`);
                }
            }
            const success = await applyImportPayload(parsed, [], targetSessionId);
            if (success) {
                toast.success("Loaded latest draft from AI Chat into dedicated canvas!", { icon: "🎨" });
            }
        } catch (err) {
            console.error("Failed to load latest chat:", err);
            toast.error("Could not load dashboard chat");
        }
    };

    const fetchBlocks = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);

            // Check for staged import from Home Chat
            let pendingImport: any = null;
            try {
                const canvasImport = typeof window !== 'undefined' ? localStorage.getItem("museflow_canvas_import") : null;
                if (canvasImport) {
                    const parsed = JSON.parse(canvasImport);
                    const importToken = parsed.id || `${parsed.importedAt || ''}_${(parsed.content || '').slice(0, 30)}`;
                    if (processedImportRef.current !== importToken) {
                        processedImportRef.current = importToken;
                        pendingImport = parsed;
                    }
                    localStorage.removeItem("museflow_canvas_import");
                }
            } catch (e) {
                console.error("Error reading canvas import:", e);
            }

            let targetCanvasId = searchParams.get('session') || searchParams.get('id') || searchParams.get('canvasId') || pendingImport?.targetSessionId || undefined;
            const isForcedNew = searchParams.get('new') === 'true' || (Boolean(importParam) && !targetCanvasId) || (Boolean(ideaIdParam) && !targetCanvasId);
            const initialTitle = topicParam || pendingImport?.topic || "New Canvas";

            let { 
                blocks: fetchedBlocks, 
                edges: fetchedEdges, 
                chatHistory: fetchedChatHistory, 
                id: actualCanvasId,
                name: canvasSessionName
            } = await getCanvasDataAction(targetCanvasId, isForcedNew, initialTitle);

            // CRITICAL SAFETY ISOLATION GUARD:
            // If there is an active import (pendingImport or importParam) and the loaded session has existing blocks (e.g. Chelsea),
            // NEVER pollute or append onto that session! Create a fresh dedicated session for the import.
            if ((pendingImport || Boolean(importParam)) && fetchedBlocks.length > 0) {
                const importTitle = pendingImport?.topic || topicParam || "Imported Canvas";
                try {
                    const newSession = await createCanvasSessionAction(importTitle);
                    if (newSession?.id) {
                        actualCanvasId = newSession.id;
                        canvasSessionName = importTitle;
                        fetchedBlocks = [];
                        fetchedEdges = [];
                        fetchedChatHistory = [];
                        window.history.replaceState(null, '', `/dashboard/canvas?session=${newSession.id}`);
                    }
                } catch (createErr) {
                    console.error("Failed to create isolated session for import:", createErr);
                }
            }
            
            // Store the resolved canvas ID so the agent can write to the correct session
            setActiveCanvasId(actualCanvasId);
            
            // Set canvas page title
            const resolvedTitle = topicParam || canvasSessionName || "Untitled Canvas";
            setPageTitle(resolvedTitle);
            
            // Load chat history from the canvas data
            if (!isSilent && fetchedChatHistory && fetchedChatHistory.length > 0) {
                setChatMessages(fetchedChatHistory.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'data' ? 'system' : msg.role as 'user' | 'assistant' | 'system',
                    parts: [{ type: 'text', text: msg.content || '' }],
                    createdAt: new Date(msg.createdAt)
                })));
            } else if (!isSilent && (!fetchedChatHistory || fetchedChatHistory.length === 0)) {
                setChatMessages([]);
            }
            
            const needsLayout = fetchedBlocks.length > 1 && fetchedBlocks.every(b => b.position.x === 0 && b.position.y === 0);

            const initialNodes: Node<BlockData>[] = fetchedBlocks.map((block: any, index: number) => ({
                id: block.id,
                type: 'custom',
                position: needsLayout ? { x: 80 + (index % 3) * 440, y: 120 + Math.floor(index / 3) * 360 } : block.position,
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

            if (pendingImport) {
                await applyImportPayload(pendingImport, [], actualCanvasId);
            } else {
                setTimeout(() => {
                    reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 });
                }, 100);
            }

            // Check for ideaId parameter in URL
            if (ideaIdParam) {
                try {
                    const loadedChat = await getChatById(ideaIdParam);
                    if (loadedChat && Array.isArray(loadedChat) && loadedChat.length > 0) {
                        const ideaContent = loadedChat.map((m: any) => m.content).filter(Boolean).join('\n\n');
                        if (ideaContent) {
                            await applyImportPayload({
                                content: ideaContent,
                                topic: topicParam || "Saved Idea"
                            }, [], actualCanvasId);
                        }
                    }
                } catch (e) {
                    console.error("Error processing ideaIdParam:", e);
                }
            }

            loadCanvasSessions();
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
            const addedBlock = await addCanvasBlockAction(newBlock, activeCanvasId);
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
            await clearCanvasAction(activeCanvasId);
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
            <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-background relative">
                {/* Top Toolbar Skeleton */}
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/60 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-6 w-44" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>

                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-28 rounded-md hidden sm:block" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>

                {/* Canvas Workspace Area Skeleton */}
                <div className="flex-1 relative overflow-hidden bg-muted/10">
                    {/* Floating Canvas Node Skeletons simulating node graph */}
                    <div className="absolute top-16 left-12 w-72 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                        <Skeleton className="h-14 w-full rounded" />
                        <div className="flex gap-1">
                            <Skeleton className="h-5 w-12 rounded" />
                            <Skeleton className="h-5 w-14 rounded" />
                        </div>
                    </div>

                    <div className="absolute top-28 left-[400px] w-80 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse hidden md:block">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-20 w-full rounded" />
                        <div className="flex justify-between pt-1">
                            <Skeleton className="h-5 w-16 rounded" />
                            <Skeleton className="h-5 w-16 rounded" />
                        </div>
                    </div>

                    <div className="absolute bottom-20 left-[260px] w-72 p-4 rounded-xl border border-border/60 bg-card shadow-md space-y-2.5 animate-pulse hidden lg:block">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-16 w-full rounded" />
                    </div>

                    {/* Floating Zoom & Controls Skeleton */}
                    <div className="absolute bottom-6 left-6 flex flex-col gap-1 p-1 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-md">
                        <Skeleton className="h-7 w-7 rounded" />
                        <Skeleton className="h-7 w-7 rounded" />
                        <Skeleton className="h-7 w-7 rounded" />
                    </div>

                    {/* MiniMap Skeleton */}
                    <div className="absolute bottom-6 right-6 w-36 h-24 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-md p-2 hidden sm:block">
                        <Skeleton className="h-full w-full rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={canvasContainerRef} className={`flex flex-col w-full h-full relative overflow-hidden bg-background ${isFullscreen ? 'h-screen p-4' : 'h-[calc(100vh-100px)]'}`}>
            {/* Top Toolbar */}
            <div className="flex flex-col gap-2 mb-3 px-2 sm:px-4 sticky top-0 z-10 bg-background/90 backdrop-blur-md pb-2.5 border-b w-full max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full">
                    {/* Left: Page Title, Session Selector & Active Profile */}
                    <div className="flex flex-col min-w-0 flex-1 mt-2">
                        <div className="flex items-center gap-2 max-w-full">
                            {/* Canvas Switcher Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-2.5 gap-1.5 text-xs font-semibold shrink-0 bg-muted/40 hover:bg-muted border-border/80 text-foreground"
                                        title="Switch between saved canvases"
                                    >
                                        <Layers className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                        <span className="hidden sm:inline">Canvases</span>
                                        <ChevronDown className="h-3 w-3 opacity-60" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-72 p-1.5 shadow-xl">
                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50 mb-1">
                                        <span className="text-xs font-semibold text-muted-foreground">My Canvases</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold gap-1 hover:bg-sky-500/10"
                                            onClick={handleCreateNewCanvas}
                                        >
                                            <Plus className="h-3 w-3" /> New
                                        </Button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                                        {canvasSessions.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                No other canvases found
                                            </div>
                                        ) : (
                                            canvasSessions.map((session) => (
                                                <DropdownMenuItem
                                                    key={session.id}
                                                    onClick={() => handleSwitchCanvas(session.id)}
                                                    className={cn(
                                                        "text-xs flex items-center justify-between p-2 rounded-md cursor-pointer group transition-colors",
                                                        session.id === activeCanvasId 
                                                            ? "bg-sky-500/10 font-semibold text-sky-700 dark:text-sky-300" 
                                                            : "hover:bg-muted text-foreground"
                                                    )}
                                                >
                                                    <div className="flex flex-col min-w-0 pr-2">
                                                        <span className="truncate">{session.name || "Untitled Canvas"}</span>
                                                    </div>
                                                    {session.id === activeCanvasId && (
                                                        <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Input
                                className="text-base sm:text-xl md:text-2xl font-bold bg-transparent border-none focus-visible:ring-0 w-full min-w-0 font-space-grotesk h-auto py-0 px-0 text-foreground placeholder:text-muted-foreground truncate"
                                type="text"
                                value={pageTitle}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Untitled Canvas"
                            />
                        </div>
                        {activeProfile && (
                            <span className="text-[11px] md:text-xs text-muted-foreground truncate mt-0.5 ml-0.5">
                                Active Profile: <span className="font-medium text-foreground/80">{activeProfile.profile_name}</span>
                            </span>
                        )}
                    </div>

                    {/* Right / Second row on mobile: Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end shrink-0 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* New Canvas Button */}
                            <Button
                                onClick={handleCreateNewCanvas}
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-medium gap-1 text-foreground hover:bg-muted"
                                title="Create a new blank canvas"
                            >
                                <Plus className="h-3.5 w-3.5 text-primary" />
                                <span className="hidden sm:inline">New Canvas</span>
                            </Button>

                            {/* Primary Action: Add Block */}
                            <Button
                                onClick={handleAddBlock}
                                size="sm"
                                className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-medium"
                            >
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Block
                            </Button>

                            {/* Import Latest AI Chat */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium gap-1.5 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                                onClick={handleLoadLatestDashboardChat}
                                title="Import latest draft or brainstorm from Dashboard AI Chat"
                            >
                                <SquarePen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden md:inline">Import Chat</span>
                            </Button>

                            {/* Save Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
                                onClick={handleSaveCanvasToIdeas}
                            >
                                <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Save to Ideas</span>
                                <span className="sm:hidden">Save</span>
                            </Button>

                            {/* Export Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium">
                                        <Download className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleExport('markdown')} className="text-xs sm:text-sm">
                                        <FileCode className="mr-2 h-4 w-4 text-orange-600" /> Markdown (.md)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('text')} className="text-xs sm:text-sm">
                                        <FileText className="mr-2 h-4 w-4 text-blue-600" /> Plain Text (.txt)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Secondary utility actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0 border-l pl-1.5 sm:pl-2 border-border/60">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />}
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        title="Clear Canvas"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                    className="max-w-sm mx-4"
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
                                    <AlertDialogFooter className="mt-2 flex-row gap-2 justify-end">
                                        <AlertDialogCancel className="h-9 text-sm mt-0">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleClearCanvas}
                                        >
                                            Clear Canvas
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
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
                        fitViewOptions={{ maxZoom: 0.70, padding: 0.1 }}
                        translateExtent={translateExtent}
                        nodeExtent={nodeExtent}
                        minZoom={minOverviewZoom * 0.9}
                        maxZoom={3.0}
                        onInit={(instance) => {
                            reactFlowInstanceRef.current = instance;
                        }}
                        preventScrolling={false}
                        className="bg-slate-100 dark:bg-slate-950"
                    >
                        <Background />
                        <CanvasZoomToolbar
                            nodes={nodes}
                            canvasBounds={canvasBounds}
                            minOverviewZoom={minOverviewZoom}
                        />
                    </ReactFlow>
                </div>

                {/* Mobile Backdrop */}
                {isChatOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
                        onClick={() => setIsChatOpen(false)}
                    />
                )}

                {/* AI Chat Drawer */}
                <div className={`transition-all duration-300 ease-in-out border rounded-none md:rounded-lg bg-background flex flex-col shadow-2xl md:shadow-lg overflow-hidden fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] md:relative md:inset-auto md:z-auto ${isChatOpen ? 'translate-x-0 md:translate-x-0 md:w-[350px] opacity-100 pointer-events-auto' : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'}`}>
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
                                    className="max-w-sm mx-4"
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
                                    <AlertDialogFooter className="mt-2 flex-row gap-2 justify-end">
                                        <AlertDialogCancel className="h-9 text-sm mt-0">Cancel</AlertDialogCancel>
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
                        {chatMessages.map((msg: any) => {
                            const textContent = typeof msg.content === 'string' && msg.content ? msg.content : (msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '');
                            const toolInvocations = msg.parts?.filter((p: any) => p.type === 'tool-invocation' || p.type === 'tool-call').map((p: any) => p.toolInvocation || p) || [];
                            
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

            <div className={`fixed md:absolute bottom-4 sm:bottom-6 transition-all duration-300 z-40 flex flex-col gap-3 ${isChatOpen ? 'md:right-[370px] right-4 sm:right-6' : 'right-4 sm:right-6'}`}>
                <Button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl transition-all duration-300 ${
                        isChatOpen ? 'bg-background text-foreground border' : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                    size="icon"
                >
                    {isChatOpen ? <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" /> : <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />}
                </Button>
            </div>
        </div>
    );
}
