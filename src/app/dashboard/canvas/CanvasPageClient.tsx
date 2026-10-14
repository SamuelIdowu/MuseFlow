"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES } from "@/types/content";
import { toast } from "react-hot-toast";

import {
  getCanvasDataAction,
  addCanvasBlockAction,
  updateCanvasBlockAction,
  deleteCanvasBlockAction,
  clearCanvasAction,
  addEdgeAction,
  deleteEdgeAction,
  addChatMessageAction,
  updateCanvasChatHistoryAction,
  generateCanvasChatResponseAction,
  createCanvasSessionAction,
  updateCanvasSessionNameAction,
  deleteCanvasSessionAction,
  getCanvasModelProviderAction,
  instantiateCanvasTemplateAction,
} from "@/features/canvas/actions/canvasActions";
import { saveToIdeasAction, getChatById } from "@/features/ideas/actions/ideaActions";

import {
  ReactFlow,
  Background,
  ReactFlowInstance,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode, { BlockData } from "@/features/canvas/components/canvas/CustomNode";
import { CanvasZoomToolbar } from "@/features/canvas/components/canvas/CanvasZoomToolbar";
import { CanvasHeader } from "@/features/canvas/components/canvas/CanvasHeader";
import { CanvasChatSidebar } from "@/features/canvas/components/canvas/CanvasChatSidebar";
import { CanvasSkeleton } from "@/features/canvas/components/canvas/CanvasSkeleton";
import { CanvasHubView } from "@/features/canvas/components/canvas/CanvasHubView";
import { CanvasTemplate } from "@/features/canvas/constants/canvasTemplates";
import { exportCanvasToEditorAction } from "@/features/canvas/utils/canvasToEditor";
import { ChannelExportModal } from "@/features/canvas/components/export/ChannelExportModal";

import { useCanvasSessions } from "@/features/canvas/hooks/useCanvasSessions";
import { useCanvasGraph } from "@/features/canvas/hooks/useCanvasGraph";
import {
  decomposeContentIntoBlocks,
  DecomposedBlock,
} from "@/features/canvas/utils/decomposeContent";
import {
  convertNodesToMarkdown,
  exportCanvas,
} from "@/features/canvas/utils/canvasExport";

const nodeTypes = {
  custom: CustomNode,
};

interface CanvasPageClientProps {
  activeProfile: Profile | null;
  clerkId: string | null;
}

export function CanvasPageClient({ activeProfile }: CanvasPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam =
    searchParams.get("session") ||
    searchParams.get("id") ||
    searchParams.get("canvasId");
  const isNewParam = searchParams.get("new") === "true";
  const importParam = searchParams.get("import");
  const topicParam = searchParams.get("topic");
  const ideaIdParam = searchParams.get("ideaId");

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionParam || null);
  const isHubView = !currentSessionId && !isNewParam && !importParam && !ideaIdParam;

  const [loading, setLoading] = useState(false);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isExportingToEditor, setIsExportingToEditor] = useState(false);
  const [isChannelExportOpen, setIsChannelExportOpen] = useState(false);
  const selectedContentTypeId = CONTENT_TYPES[0]?.id || "linkedin_post";

  // Navigation and initialization refs to prevent render/compile loops
  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const processedImportRef = useRef<string | null>(null);
  const processedIdeaIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const {
    canvasSessions,
    activeCanvasId,
    setActiveCanvasId,
    pageTitle,
    setPageTitle,
    handleTitleChange,
    loadCanvasSessions,
    handleSwitchCanvas,
  } = useCanvasSessions();

  // Template instantiation handler
  const handleSelectTemplate = async (template: CanvasTemplate) => {
    try {
      setIsCreatingCanvas(true);
      const newSession = await instantiateCanvasTemplateAction({
        title: template.title,
        blocks: template.blocks,
        edges: template.edges,
      });

      if (!newSession?.id) throw new Error("Could not create canvas session");

      toast.success(`Created "${template.title}" canvas!`);
      lastLoadedSessionIdRef.current = newSession.id;
      setCurrentSessionId(newSession.id);
      setActiveCanvasId(newSession.id);
      router.push(`/dashboard/canvas?session=${newSession.id}`);
      await fetchBlocks(newSession.id);
      loadCanvasSessions();
    } catch (err: any) {
      console.error("Failed to load template:", err);
      toast.error(err?.message || "Could not load canvas template");
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      setIsCreatingCanvas(true);
      const newSession = await createCanvasSessionAction("New Canvas");
      if (newSession?.id) {
        toast.success("Created new canvas");
        lastLoadedSessionIdRef.current = newSession.id;
        setCurrentSessionId(newSession.id);
        setActiveCanvasId(newSession.id);
        router.push(`/dashboard/canvas?session=${newSession.id}`);
        await fetchBlocks(newSession.id);
        loadCanvasSessions();
      }
    } catch (err) {
      console.error("Failed to create new canvas:", err);
      toast.error("Could not create new canvas");
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    if (id === currentSessionId && id === lastLoadedSessionIdRef.current) return;
    lastLoadedSessionIdRef.current = id;
    setCurrentSessionId(id);
    setActiveCanvasId(id);
    router.push(`/dashboard/canvas?session=${id}`);
    await fetchBlocks(id);
  };

  const handleDeleteCanvasSession = async (id: string) => {
    try {
      await deleteCanvasSessionAction(id);
      toast.success("Canvas deleted");
      if (activeCanvasId === id || currentSessionId === id) {
        lastLoadedSessionIdRef.current = null;
        setCurrentSessionId(null);
        setActiveCanvasId(undefined);
        router.push("/dashboard/canvas");
      }
      loadCanvasSessions();
    } catch (err) {
      console.error("Failed to delete canvas:", err);
      toast.error("Could not delete canvas");
    }
  };

  const handleBackToHub = () => {
    lastLoadedSessionIdRef.current = null;
    setCurrentSessionId(null);
    setActiveCanvasId(undefined);
    router.push("/dashboard/canvas");
  };

  // Canvas Graph hook
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    translateExtent,
    nodeExtent,
    minOverviewZoom,
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    handleAddBlock,
    handleDeleteBlock,
    handleUpdateBlock,
    handleExpandWithAI,
    handleRegenerateBlock,
    setEditingBlockId,
  } = useCanvasGraph({
    activeCanvasId,
    pageTitle,
    activeProfile,
    selectedContentTypeId,
  });

  const handleSendToEditor = async () => {
    if (nodes.length === 0) {
      toast.error("Add at least one block to export to the editor");
      return;
    }
    try {
      setIsExportingToEditor(true);
      const { docId } = await exportCanvasToEditorAction(nodes, edges, pageTitle);
      toast.success("Compiled canvas into document draft!");
      router.push(`/dashboard/editor?docId=${docId}`);
    } catch (err) {
      console.error("Failed to send canvas to editor:", err);
      toast.error("Could not export canvas to editor");
    } finally {
      setIsExportingToEditor(false);
    }
  };

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [modelProvider, setModelProvider] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    { name: string; type: string; data: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fullscreen & DOM refs
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<
    Node<BlockData>,
    Edge
  > | null>(null);

  useEffect(() => {
    getCanvasModelProviderAction()
      .then((provider) => setModelProvider(provider))
      .catch(() => setModelProvider("gemini"));
  }, []);

  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Error entering full-screen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Import payload application
  const applyImportPayload = useCallback(
    async (parsed: any, _existingNodes?: Node<BlockData>[], targetCanvasId?: string) => {
      if (!parsed || (!parsed.content && !parsed.topic)) return false;

      const contentToInsert = parsed.content || parsed.topic || "";
      const topicTitle = parsed.topic || parsed.title;

      const decomposed = decomposeContentIntoBlocks(contentToInsert, topicTitle);
      if (decomposed.length === 0) return false;

      const effectiveTitle =
        decomposed[0]?.extractedTitle || topicTitle || "Imported Canvas";
      setPageTitle(effectiveTitle);

      const resolvedCanvasId =
        targetCanvasId ||
        activeCanvasId ||
        searchParams.get("session") ||
        searchParams.get("id") ||
        undefined;

      if (resolvedCanvasId) {
        updateCanvasSessionNameAction(resolvedCanvasId, effectiveTitle).catch(
          console.error
        );
      }

      // Check if this is a branching brainstorm (Option 1, 2, 3...) or sequential pipeline
      const childrenCount = decomposed.length - 1;
      const isBranching =
        decomposed.length > 1 &&
        decomposed[0].parentIndex === undefined &&
        decomposed.slice(1).every((b) => b.parentIndex === 0);

      const isSequential =
        !isBranching &&
        decomposed.length > 1 &&
        decomposed.slice(1).every((b, i) => b.parentIndex === i);

      const startX = 80;
      const startY = 120;
      const colWidth = 440;
      const rowHeight = 360;

      const newNodes: Node<BlockData>[] = [];
      const tempBlockMap: {
        tempId: string;
        block: DecomposedBlock;
        index: number;
        position: { x: number; y: number };
      }[] = [];

      decomposed.forEach((block, idx) => {
        const tempId = `imported_${Date.now()}_${idx}`;
        let position = { x: startX, y: startY };

        if (isBranching) {
          if (idx === 0) {
            // Root prompt/goal block vertically centered relative to child branches
            const totalBranchHeight = Math.min(childrenCount, 4) * 340;
            const rootY = Math.max(80, totalBranchHeight / 2 - 120);
            position = { x: 80, y: rootY };
          } else {
            const childIdx = idx - 1;
            if (childrenCount <= 4) {
              position = { x: 580, y: 60 + childIdx * 340 };
            } else {
              const col = childIdx % 2;
              const row = Math.floor(childIdx / 2);
              position = { x: 580 + col * 460, y: 60 + row * 340 };
            }
          }
        } else if (isSequential) {
          if (decomposed.length <= 4) {
            position = { x: startX + idx * 460, y: 120 };
          } else {
            position = {
              x: startX + (idx % 3) * colWidth,
              y: startY + Math.floor(idx / 3) * rowHeight,
            };
          }
        } else {
          position = {
            x: startX + (idx % 3) * colWidth,
            y: startY + Math.floor(idx / 3) * rowHeight,
          };
        }

        const node: Node<BlockData> = {
          id: tempId,
          type: "custom",
          position,
          dragHandle: ".drag-handle",
          data: {
            id: tempId,
            type: block.type,
            content: block.content,
            title: block.title,
            order: idx,
            onUpdate: handleUpdateBlock,
            onExpand: handleExpandWithAI,
            onRegenerate: handleRegenerateBlock,
            onDelete: handleDeleteBlock,
            isEditing: false,
            isExpanding: false,
            isRegenerating: false,
            setEditingId: setEditingBlockId,
          },
        };
        newNodes.push(node);
        tempBlockMap.push({ tempId, block, index: idx, position });
      });

      // Construct connecting edges immediately based on parentIndex
      const newEdges: Edge[] = [];
      decomposed.forEach((block, idx) => {
        if (block.parentIndex !== undefined && tempBlockMap[block.parentIndex]) {
          const parentTempId = tempBlockMap[block.parentIndex].tempId;
          const childTempId = tempBlockMap[idx].tempId;
          newEdges.push({
            id: `edge_${parentTempId}_${childTempId}`,
            source: parentTempId,
            target: childTempId,
            type: "smoothstep",
            animated: true,
            label: block.edgeLabel,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);

      // Fit view smoothly so all imported blocks and edges are neatly visible
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({
          padding: 0.2,
          duration: 400,
        });
      }, 150);

      // Async DB persist
      try {
        const idMapping = new Map<string, string>(); // tempId -> realId
        for (const item of tempBlockMap) {
          try {
            const added = await addCanvasBlockAction(
              {
                type: item.block.type || "paragraph",
                content: item.block.content,
                order: item.index,
                position: item.position,
                title: item.block.title,
              },
              resolvedCanvasId
            );
            if (added?.id) {
              idMapping.set(item.tempId, added.id);
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === item.tempId
                    ? {
                        ...n,
                        id: added.id,
                        data: { ...n.data, id: added.id },
                      }
                    : n
                )
              );
            }
          } catch (err) {
            console.warn(`Could not save imported block ${item.index} to DB:`, err);
          }
        }

        // Persist edges to DB
        for (const edge of newEdges) {
          const realSource = idMapping.get(edge.source);
          const realTarget = idMapping.get(edge.target);
          if (realSource && realTarget) {
            try {
              const savedEdge = await addEdgeAction({
                source: realSource,
                target: realTarget,
                label: (edge.label as string) || undefined,
              });
              if (savedEdge?.id) {
                setEdges((eds) =>
                  eds.map((e) =>
                    e.id === edge.id
                      ? {
                          ...e,
                          id: savedEdge.id,
                          source: realSource,
                          target: realTarget,
                        }
                      : e
                  )
                );
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
    },
    [
      activeCanvasId,
      searchParams,
      setNodes,
      setEdges,
      setPageTitle,
      handleUpdateBlock,
      handleExpandWithAI,
      handleRegenerateBlock,
      handleDeleteBlock,
      setEditingBlockId,
    ]
  );

  const handleLoadLatestDashboardChat = async () => {
    try {
      const raw =
        localStorage.getItem("museflow_canvas_import") ||
        localStorage.getItem("museflow_latest_ai_chat");
      if (!raw) {
        toast.error("No recent AI chat draft found in storage.");
        return;
      }
      const parsed = JSON.parse(raw);
      let targetSessionId = activeCanvasId;
      if (nodes.length > 0) {
        const topicTitle = parsed.topic || parsed.title || "Imported Canvas";
        const newSession = await createCanvasSessionAction(topicTitle);
        if (newSession?.id) {
          targetSessionId = newSession.id;
          lastLoadedSessionIdRef.current = newSession.id;
          setCurrentSessionId(newSession.id);
          setActiveCanvasId(newSession.id);
          loadCanvasSessions();
          router.replace(`/dashboard/canvas?session=${newSession.id}`);
        }
      }
      const success = await applyImportPayload(parsed, [], targetSessionId);
      if (success) {
        toast.success("Loaded draft from AI Chat into canvas!");
      }
    } catch (err) {
      console.error("Failed to load latest chat:", err);
      toast.error("Could not load dashboard chat");
    }
  };

  const fetchBlocks = async (
    sessionOrSilent?: string | boolean,
    silentOption: boolean = false
  ) => {
    const overrideSessionId =
      typeof sessionOrSilent === "string" ? sessionOrSilent : undefined;
    const isSilent =
      typeof sessionOrSilent === "boolean" ? sessionOrSilent : silentOption;

    try {
      if (!isSilent) setLoading(true);

      let pendingImport: any = null;
      try {
        const canvasImport =
          typeof window !== "undefined"
            ? localStorage.getItem("museflow_canvas_import")
            : null;
        if (canvasImport) {
          const parsed = JSON.parse(canvasImport);
          const importToken =
            parsed.id ||
            `${parsed.importedAt || ""}_${(parsed.content || "").slice(0, 30)}`;
          if (processedImportRef.current !== importToken) {
            processedImportRef.current = importToken;
            pendingImport = parsed;
          }
          localStorage.removeItem("museflow_canvas_import");
        }
      } catch (e) {
        console.error("Error reading canvas import:", e);
      }

      let targetCanvasId =
        overrideSessionId ||
        currentSessionId ||
        searchParams.get("session") ||
        searchParams.get("id") ||
        searchParams.get("canvasId") ||
        pendingImport?.targetSessionId ||
        undefined;
      const isForcedNew =
        !overrideSessionId &&
        (searchParams.get("new") === "true" ||
        (Boolean(importParam) && !targetCanvasId) ||
        (Boolean(ideaIdParam) && !targetCanvasId));
      const initialTitle = topicParam || pendingImport?.topic || "New Canvas";

      let {
        blocks: fetchedBlocks,
        edges: fetchedEdges,
        chatHistory: fetchedChatHistory,
        id: actualCanvasId,
        name: canvasSessionName,
      } = await getCanvasDataAction(targetCanvasId, isForcedNew, initialTitle);

      if ((pendingImport || Boolean(importParam)) && fetchedBlocks.length > 0 && !overrideSessionId) {
        const importTitle =
          pendingImport?.topic || topicParam || "Imported Canvas";
        try {
          const newSession = await createCanvasSessionAction(importTitle);
          if (newSession?.id) {
            actualCanvasId = newSession.id;
            canvasSessionName = importTitle;
            fetchedBlocks = [];
            fetchedEdges = [];
            fetchedChatHistory = [];
          }
        } catch (createErr) {
          console.error("Failed to create isolated session for import:", createErr);
        }
      }

      lastLoadedSessionIdRef.current = actualCanvasId;
      setCurrentSessionId(actualCanvasId);
      setActiveCanvasId(actualCanvasId);
      const resolvedTitle =
        topicParam || canvasSessionName || "Untitled Canvas";
      setPageTitle(resolvedTitle);

      if (!isSilent && fetchedChatHistory && fetchedChatHistory.length > 0) {
        setChatMessages(
          fetchedChatHistory.map((msg: any) => ({
            id: msg.id,
            role:
              msg.role === "data"
                ? "system"
                : (msg.role as "user" | "assistant" | "system"),
            parts: [{ type: "text", text: msg.content || "" }],
            createdAt: new Date(msg.createdAt),
          }))
        );
      } else if (
        !isSilent &&
        (!fetchedChatHistory || fetchedChatHistory.length === 0)
      ) {
        setChatMessages([]);
      }

      const needsLayout =
        fetchedBlocks.length > 1 &&
        fetchedBlocks.every((b) => b.position.x === 0 && b.position.y === 0);

      const initialNodes: Node<BlockData>[] = fetchedBlocks.map(
        (block: any, index: number) => ({
          id: block.id,
          type: "custom",
          position: needsLayout
            ? {
                x: 80 + (index % 3) * 440,
                y: 120 + Math.floor(index / 3) * 360,
              }
            : block.position,
          dragHandle: ".drag-handle",
          data: {
            id: block.id,
            type: block.type || "paragraph",
            content: block.content,
            title: block.title,
            order: block.order,
            onUpdate: handleUpdateBlock,
            onExpand: handleExpandWithAI,
            onRegenerate: handleRegenerateBlock,
            onDelete: handleDeleteBlock,
            isEditing: false,
            isExpanding: false,
            isRegenerating: false,
            setEditingId: setEditingBlockId,
          },
        })
      );

      setNodes(initialNodes);
      setEdges(
        (fetchedEdges || []).map((e: any) => ({
          ...e,
          type: e.type || "smoothstep",
          animated: e.animated ?? true,
          style: e.style || { stroke: "#6366f1", strokeWidth: 2 },
        }))
      );

      if (pendingImport) {
        await applyImportPayload(pendingImport, [], actualCanvasId);
      } else {
        setTimeout(() => {
          reactFlowInstanceRef.current?.fitView({
            padding: 0.25,
            duration: 400,
          });
        }, 100);
      }

      if (ideaIdParam && processedIdeaIdRef.current !== ideaIdParam) {
        processedIdeaIdRef.current = ideaIdParam;
        try {
          const loadedChat = await getChatById(ideaIdParam);
          if (
            loadedChat &&
            Array.isArray(loadedChat) &&
            loadedChat.length > 0
          ) {
            const ideaContent = loadedChat
              .map((m: any) => m.content)
              .filter(Boolean)
              .join("\n\n");
            if (ideaContent) {
              await applyImportPayload(
                { content: ideaContent, topic: topicParam || "Saved Idea" },
                [],
                actualCanvasId
              );
            }
          }
        } catch (e) {
          console.error("Error processing ideaIdParam:", e);
        }
      }

      // If the URL had temporary query params (import, new, ideaId, or topic without session),
      // cleanly replace URL so searchParams is synchronized without loop
      if (isNewParam || importParam || ideaIdParam || (topicParam && !sessionParam)) {
        router.replace(`/dashboard/canvas?session=${actualCanvasId}`);
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
    if (sessionParam) {
      if (lastLoadedSessionIdRef.current !== sessionParam) {
        lastLoadedSessionIdRef.current = sessionParam;
        setCurrentSessionId(sessionParam);
        fetchBlocks(sessionParam);
      }
    } else if (isNewParam || importParam || topicParam || ideaIdParam) {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;
      fetchBlocks().finally(() => {
        isInitializingRef.current = false;
      });
    } else {
      lastLoadedSessionIdRef.current = null;
      setCurrentSessionId(null);
      setLoading(false);
    }
  }, [sessionParam, isNewParam, importParam, topicParam, ideaIdParam]);

  // Chat handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        setSelectedFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, data: base64 },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text && selectedFiles.length === 0) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: text,
      parts: [{ type: "text", text }],
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);
    setIsChatLoading(true);
    setAgentStatus("Thinking...");

    if (activeCanvasId) {
      addChatMessageAction(userMsg, activeCanvasId).catch(console.error);
    }

    try {
      const currentCanvas = {
        blocks: nodes.map((n) => ({
          id: n.id,
          type: n.data?.type || "paragraph",
          content: n.data?.content || "",
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        })),
      };

      const historyFormatted = chatMessages.map((m) => ({
        role: m.role,
        content: m.content || m.parts?.[0]?.text || "",
      }));

      const response = await generateCanvasChatResponseAction(
        text,
        historyFormatted,
        filesToSend.map((f) => ({ data: f.data, mimeType: f.type })),
        currentCanvas
      );

      let replyMessage = "";
      let generatedBlocks: any[] = [];
      let generatedEdges: any[] = [];

      if (typeof response === "string") {
        replyMessage = response;
      } else if (response) {
        replyMessage = response.message || (response as any).content || "";
        generatedBlocks = response.blocks || [];
        generatedEdges = response.edges || [];
        if ((response as any).source === "research_agent") {
          setModelProvider("research agent");
        } else if ((response as any).source === "gemini") {
          setModelProvider("gemini");
        }
      }

      if (generatedBlocks && generatedBlocks.length > 0) {
        setAgentStatus("Applying blocks to canvas...");
        const idMap = new Map<string, string>();

        for (let i = 0; i < generatedBlocks.length; i++) {
          const blk = generatedBlocks[i];
          const pos = blk.position || (blk.x !== undefined && blk.y !== undefined ? { x: blk.x, y: blk.y } : undefined);

          if (blk.action === "delete" && blk.id) {
            try {
              await deleteCanvasBlockAction(blk.id);
            } catch (delErr) {
              console.warn("Failed to delete canvas block:", blk.id, delErr);
            }
          } else if (blk.action === "update" && blk.id) {
            try {
              await updateCanvasBlockAction(blk.id, {
                type: blk.type,
                content: blk.content,
                position: pos,
              });
              idMap.set(blk.id, blk.id);
            } catch (updErr) {
              console.warn("Failed to update canvas block:", blk.id, updErr);
            }
          } else {
            // Default: 'create'
            try {
              const added = await addCanvasBlockAction(
                {
                  type: blk.type || "paragraph",
                  content: blk.content || "",
                  order: nodes.length + i,
                  position: pos,
                },
                activeCanvasId
              );
              if (added?.id) {
                if (blk.id) {
                  idMap.set(blk.id, added.id);
                }
                idMap.set(`node-${i + 1}`, added.id);
                idMap.set(`node-${i}`, added.id);
                idMap.set(String(i), added.id);
              }
            } catch (addErr) {
              console.error("Failed to add canvas block:", addErr);
            }
          }
        }

        // Apply generated edges
        if (generatedEdges && generatedEdges.length > 0) {
          setAgentStatus("Connecting canvas nodes...");
          for (const edge of generatedEdges) {
            if (edge.action === "delete" && edge.id) {
              try {
                await deleteEdgeAction(edge.id);
              } catch (delEdgeErr) {
                console.warn("Failed to delete edge:", edge.id, delEdgeErr);
              }
            } else {
              const realSource = idMap.get(edge.source) || edge.source;
              const realTarget = idMap.get(edge.target) || edge.target;
              if (realSource && realTarget && realSource !== realTarget) {
                try {
                  await addEdgeAction({
                    source: realSource,
                    target: realTarget,
                    label: edge.label || undefined,
                  });
                } catch (edgeErr) {
                  console.warn("Failed to create edge:", edge, edgeErr);
                }
              }
            }
          }
        }

        await fetchBlocks(true);
      }

      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: replyMessage,
        parts: [{ type: "text", text: replyMessage }],
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      if (activeCanvasId) {
        addChatMessageAction(assistantMsg, activeCanvasId).catch(console.error);
      }
    } catch (error: any) {
      console.error("Canvas AI Error:", error);
      toast.error("Failed to generate AI response");
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content:
            "Sorry, I ran into an issue connecting to the AI model. Please try again.",
          parts: [
            {
              type: "text",
              text: "Sorry, I ran into an issue connecting to the AI model. Please try again.",
            },
          ],
        },
      ]);
    } finally {
      setIsChatLoading(false);
      setAgentStatus(null);
    }
  };

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

  const handleClearChat = async () => {
    setChatMessages([]);
    try {
      if (activeCanvasId) {
        await updateCanvasChatHistoryAction([], activeCanvasId);
      }
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      toast.error("Failed to clear chat history");
    }
  };

  const handleSaveCanvasToIdeas = async () => {
    const content = convertNodesToMarkdown(nodes, pageTitle);
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

  const handleExport = (format: "markdown" | "text") => {
    exportCanvas(nodes, pageTitle, format);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  if (isHubView) {
    return (
      <CanvasHubView
        canvasSessions={canvasSessions}
        onCreateNew={handleCreateNew}
        onSelectSession={handleSelectSession}
        onSelectTemplate={handleSelectTemplate}
        onDeleteSession={handleDeleteCanvasSession}
        isCreating={isCreatingCanvas}
      />
    );
  }

  if (loading) {
    return <CanvasSkeleton />;
  }

  return (
    <div
      ref={canvasContainerRef}
      className={`flex flex-col w-full h-full relative overflow-hidden bg-background ${
        isFullscreen ? "h-screen p-4" : "h-[calc(100vh-100px)]"
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col gap-2 mb-3 px-2 sm:px-4 sticky top-0 z-10 bg-background/90 backdrop-blur-md pb-2.5 border-b w-full max-w-full overflow-hidden">
        <CanvasHeader
          pageTitle={pageTitle}
          onTitleChange={handleTitleChange}
          activeProfile={activeProfile}
          canvasSessions={canvasSessions}
          activeCanvasId={activeCanvasId}
          onSwitchCanvas={handleSelectSession}
          onCreateNewCanvas={handleCreateNew}
          onBackToHub={handleBackToHub}
          onExportToEditor={handleSendToEditor}
          isExportingToEditor={isExportingToEditor}
          onOpenChannelExport={() => setIsChannelExportOpen(true)}
          onAddBlock={handleAddBlock}
          onLoadLatestDashboardChat={handleLoadLatestDashboardChat}
          onSaveCanvasToIdeas={handleSaveCanvasToIdeas}
          onExport={handleExport}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onClearCanvas={handleClearCanvas}
          canvasContainerRef={canvasContainerRef}
        />
      </div>

      {/* Main Canvas & Chat Layout */}
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
            fitViewOptions={{ maxZoom: 0.7, padding: 0.1 }}
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
            <Background gap={24} size={1.5} />
            <CanvasZoomToolbar minOverviewZoom={minOverviewZoom} />
          </ReactFlow>
        </div>

        {/* AI Chat Drawer */}
        <CanvasChatSidebar
          isChatOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
          modelProvider={modelProvider}
          agentStatus={agentStatus}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          isChatLoading={isChatLoading}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          isFullscreen={isFullscreen}
          containerRef={canvasContainerRef}
        />
      </div>

      <ChannelExportModal
        isOpen={isChannelExportOpen}
        onClose={() => setIsChannelExportOpen(false)}
        title={pageTitle}
        content={convertNodesToMarkdown(nodes, pageTitle)}
      />
    </div>
  );
}
