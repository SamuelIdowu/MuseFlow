"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  CoordinateExtent,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { BlockData } from "@/features/canvas/components/canvas/CustomNode";
import {
  addCanvasBlockAction,
  updateCanvasBlockAction,
  deleteCanvasBlockAction,
  addEdgeAction,
  deleteEdgeAction,
} from "@/features/canvas/actions/canvasActions";
import { toast } from "react-hot-toast";

interface UseCanvasGraphProps {
  activeCanvasId?: string;
  pageTitle: string;
  activeProfile: any;
  selectedContentTypeId: string;
}

export function useCanvasGraph({
  activeCanvasId,
  pageTitle,
  activeProfile,
  selectedContentTypeId,
}: UseCanvasGraphProps) {
  const [nodes, setNodes, onNodesChangeState] = useNodesState<Node<BlockData>>([]);
  const [edges, setEdges, onEdgesChangeState] = useEdgesState<Edge>([]);

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [expandingBlockId, setExpandingBlockId] = useState<string | null>(null);
  const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);

  const saveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Finite Canvas Workspace Boundaries
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
      {
        x: canvasBounds.x,
        y: canvasBounds.y,
        width: canvasBounds.width,
        height: canvasBounds.height,
      },
      containerWidth,
      containerHeight,
      0.05,
      1.0,
      0.04
    );
    return Math.max(0.08, Math.min(vp.zoom, 1.0));
  }, [canvasBounds]);

  // Sync block state flags (editing, expanding, regenerating)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: node.id === editingBlockId,
          isExpanding: node.id === expandingBlockId,
          isRegenerating: node.id === regeneratingBlockId,
          setEditingId: setEditingBlockId,
        },
      }))
    );
  }, [editingBlockId, expandingBlockId, regeneratingBlockId, setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<BlockData>>[]) => {
      onNodesChangeState(changes);
    },
    [onNodesChangeState]
  );

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateCanvasBlockAction(node.id, {
      position: { x: node.position.x, y: node.position.y },
    }).catch((err) => console.error("Failed to save position", err));
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeState(changes);
      changes.forEach((change) => {
        if (change.type === "remove") {
          deleteEdgeAction(change.id).catch((err) =>
            console.error("Failed to delete edge", err)
          );
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
          target: params.target,
        });
      } catch (error) {
        console.error("Failed to create edge", error);
        toast.error("Failed to connect nodes");
      }
    },
    [setEdges]
  );

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

  const handleUpdateBlock = async (id: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );

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
      updateCanvasBlockAction(id, { type: updates.type }).catch((error) => {
        console.error("Error updating block type:", error);
        toast.error("Failed to update block type");
      });
    }
  };

  const handleExpandWithAI = async (id: string, content: string, blockType: string) => {
    if (!content?.trim()) {
      toast.error("Please add some content before expanding");
      return;
    }
    try {
      setExpandingBlockId(id);
      const contextBlocks = nodes
        .filter((n) => n.id !== id)
        .map((n) => ({ type: n.data?.type, content: n.data?.content }));

      const response = await fetch("/api/canvas/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_content: content,
          block_type: blockType,
          canvas_title: pageTitle,
          active_profile: activeProfile,
          contentTypeId: selectedContentTypeId,
          context_blocks: contextBlocks,
          mode: "expand",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to expand content");
      }

      const data = await response.json();
      if (data.expanded_content && data.expanded_content.trim() !== content.trim()) {
        await handleUpdateBlock(id, { content: data.expanded_content });
        toast.success("Content expanded!");
      } else {
        toast("AI provided no additional detail for this block.");
      }
    } catch (error: any) {
      console.error("[AI] Error expanding content:", error);
      toast.error(error.message || "Failed to expand content");
    } finally {
      setExpandingBlockId(null);
    }
  };

  const handleRegenerateBlock = async (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const content = node.data?.content as string;
    if (!content?.trim()) {
      toast.error("Block content is empty.");
      return;
    }

    try {
      setRegeneratingBlockId(id);
      const contextBlocks = nodes
        .filter((n) => n.id !== id)
        .map((n) => ({ type: n.data?.type, content: n.data?.content }));

      const response = await fetch("/api/canvas/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_content: content,
          block_type: node.data?.type,
          canvas_title: pageTitle,
          active_profile: activeProfile,
          contentTypeId: selectedContentTypeId,
          context_blocks: contextBlocks,
          mode: "regenerate",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to regenerate content");
      }

      const data = await response.json();
      if (data.expanded_content && data.expanded_content.trim() !== content.trim()) {
        await handleUpdateBlock(id, { content: data.expanded_content });
        toast.success("Content regenerated!");
      } else {
        toast("AI returned identical content.");
      }
    } catch (error: any) {
      console.error("[AI] Error regenerating content:", error);
      toast.error(error.message || "Failed to regenerate content");
    } finally {
      setRegeneratingBlockId(null);
    }
  };

  const handleAddBlock = async () => {
    try {
      const lastNode = nodes[nodes.length - 1];
      const position = lastNode
        ? { x: lastNode.position.x, y: lastNode.position.y + 350 }
        : { x: 250, y: 100 };
      const newBlock = {
        type: "paragraph",
        content: "",
        order: nodes.length,
        position,
      };
      const addedBlock = await addCanvasBlockAction(newBlock, activeCanvasId);
      const newNode: Node<BlockData> = {
        id: addedBlock.id,
        type: "custom",
        position: addedBlock.position,
        dragHandle: ".drag-handle",
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
          setEditingId: setEditingBlockId,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast.success("Block added");
    } catch (error) {
      console.error("Error adding block:", error);
      toast.error("Failed to add block");
    }
  };

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    canvasBounds,
    translateExtent,
    nodeExtent,
    minOverviewZoom,
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    handleAddBlock,
    handleUpdateBlock,
    handleExpandWithAI,
    handleRegenerateBlock,
    editingBlockId,
    setEditingBlockId,
  };
}
