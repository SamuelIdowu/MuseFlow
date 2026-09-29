import { db } from "../index";
import { canvasSessions, canvasBlocks, canvasEdges, chatMessages } from "../schema/canvas";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";

export async function getCanvasDataFromDb(
  userId: string,
  canvasId?: string,
  forceNewSession?: boolean,
  newSessionTitle?: string
) {
  let session = null;

  if (canvasId) {
    session = await db.query.canvasSessions.findFirst({
      where: and(eq(canvasSessions.id, canvasId), eq(canvasSessions.userId, userId)),
    });
  }

  if (!session && forceNewSession) {
    const [newSession] = await db
      .insert(canvasSessions)
      .values({
        userId,
        name: newSessionTitle || "New Canvas",
      })
      .returning();
    session = newSession;
  }

  if (!session) {
    session = await db.query.canvasSessions.findFirst({
      where: eq(canvasSessions.userId, userId),
      orderBy: [desc(canvasSessions.updatedAt)],
    });
  }

  if (!session) {
    const [newSession] = await db
      .insert(canvasSessions)
      .values({
        userId,
        name: newSessionTitle || "New Canvas",
      })
      .returning();
    session = newSession;
  }

  const [blocks, edges, messages] = await Promise.all([
    db.query.canvasBlocks.findMany({
      where: and(eq(canvasBlocks.canvasId, session.id), eq(canvasBlocks.userId, userId)),
      orderBy: [asc(canvasBlocks.orderIndex)],
    }),
    db.query.canvasEdges.findMany({
      where: and(eq(canvasEdges.canvasId, session.id), eq(canvasEdges.userId, userId)),
      orderBy: [asc(canvasEdges.createdAt)],
    }),
    db.query.chatMessages.findMany({
      where: and(eq(chatMessages.canvasId, session.id), eq(chatMessages.userId, userId)),
      orderBy: [asc(chatMessages.createdAt)],
    }),
  ]);

  return {
    id: session.id,
    name: session.name || "Untitled Canvas",
    blocks: blocks.map((b) => ({
      id: b.id,
      type: b.type || "paragraph",
      content: b.content,
      order: b.orderIndex,
      position: { x: b.positionX ?? 0, y: b.positionY ?? 0 },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.sourceBlockId,
      target: e.targetBlockId,
      label: e.label,
    })),
    chatHistory: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      toolInvocations: m.toolInvocations || undefined,
    })),
  };
}

export async function instantiateCanvasTemplateInDb(
  userId: string,
  template: {
    title: string;
    blocks: Array<{ tempId: string; type: string; content: string; x: number; y: number }>;
    edges: Array<{ source: string; target: string; label?: string }>;
  }
) {
  const [session] = await db
    .insert(canvasSessions)
    .values({
      userId,
      name: template.title,
    })
    .returning();

  const blocksToInsert = template.blocks.map((blk, idx) => ({
    canvasId: session.id,
    userId,
    type: blk.type,
    content: blk.content,
    orderIndex: idx,
    positionX: blk.x,
    positionY: blk.y,
  }));

  const insertedBlocks = await db
    .insert(canvasBlocks)
    .values(blocksToInsert)
    .returning();

  const idMap = new Map<string, string>();
  template.blocks.forEach((blk, idx) => {
    if (insertedBlocks[idx]) {
      idMap.set(blk.tempId, insertedBlocks[idx].id);
    }
  });

  if (template.edges && template.edges.length > 0) {
    const edgesToInsert = template.edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        canvasId: session.id,
        userId,
        sourceBlockId: idMap.get(e.source)!,
        targetBlockId: idMap.get(e.target)!,
        label: e.label || null,
      }));

    if (edgesToInsert.length > 0) {
      await db.insert(canvasEdges).values(edgesToInsert);
    }
  }

  return session;
}

export async function addChatMessageToDb(
  userId: string,
  message: { id?: string; role: string; content?: string; toolInvocations?: any; createdAt?: string },
  canvasId?: string
) {
  try {
    await db.insert(chatMessages).values({
      id: message.id || crypto.randomUUID(),
      userId,
      canvasId: canvasId || null,
      role: message.role,
      content: message.content || "",
      toolInvocations: message.toolInvocations || null,
      createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
    });
  } catch (err) {
    console.warn("[addChatMessageToDb] Error inserting message:", err);
  }
}

export async function getGlobalChatMessagesFromDb(userId: string) {
  try {
    const messages = await db.query.chatMessages.findMany({
      where: and(eq(chatMessages.userId, userId), isNull(chatMessages.canvasId)),
      orderBy: [asc(chatMessages.createdAt)],
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      toolInvocations: m.toolInvocations || undefined,
    }));
  } catch {
    return [];
  }
}

export async function addCanvasBlockToDb(
  userId: string,
  block: { type: string; content: string; order: number; position?: { x: number; y: number } },
  canvasId?: string
) {
  let targetCanvasId = canvasId;
  if (!targetCanvasId) {
    const latestSession = await db.query.canvasSessions.findFirst({
      where: eq(canvasSessions.userId, userId),
      orderBy: [desc(canvasSessions.updatedAt)],
    });
    if (latestSession) {
      targetCanvasId = latestSession.id;
    } else {
      const [newSession] = await db
        .insert(canvasSessions)
        .values({ userId, name: "My Visual Canvas" })
        .returning();
      targetCanvasId = newSession.id;
    }
  }

  const [inserted] = await db
    .insert(canvasBlocks)
    .values({
      canvasId: targetCanvasId,
      userId,
      type: block.type,
      content: block.content,
      orderIndex: block.order,
      positionX: block.position?.x ?? 0,
      positionY: block.position?.y ?? 0,
    })
    .returning();

  return {
    id: inserted.id,
    user_id: inserted.userId,
    canvas_id: inserted.canvasId,
    type: inserted.type,
    content: inserted.content,
    order_index: inserted.orderIndex,
    position_x: inserted.positionX,
    position_y: inserted.positionY,
    position: { x: inserted.positionX, y: inserted.positionY },
    created_at: inserted.createdAt.toISOString(),
    updated_at: inserted.updatedAt.toISOString(),
  };
}

export async function updateCanvasBlockInDb(
  userId: string,
  id: string,
  updates: { content?: string; type?: string; position?: { x: number; y: number } }
) {
  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.position !== undefined) {
    updateData.positionX = updates.position.x;
    updateData.positionY = updates.position.y;
  }

  await db
    .update(canvasBlocks)
    .set(updateData)
    .where(and(eq(canvasBlocks.id, id), eq(canvasBlocks.userId, userId)));
}

export async function deleteCanvasBlockFromDb(userId: string, id: string) {
  await db
    .delete(canvasBlocks)
    .where(and(eq(canvasBlocks.id, id), eq(canvasBlocks.userId, userId)));
}

export async function addEdgeToDb(
  userId: string,
  edge: { source: string; target: string; label?: string }
) {
  const sourceBlock = await db.query.canvasBlocks.findFirst({
    where: and(eq(canvasBlocks.id, edge.source), eq(canvasBlocks.userId, userId)),
  });

  if (!sourceBlock) {
    throw new Error("Source block not found or access denied");
  }

  const [inserted] = await db
    .insert(canvasEdges)
    .values({
      canvasId: sourceBlock.canvasId,
      userId,
      sourceBlockId: edge.source,
      targetBlockId: edge.target,
      label: edge.label || null,
    })
    .returning();

  return {
    id: inserted.id,
    source: inserted.sourceBlockId,
    target: inserted.targetBlockId,
    label: inserted.label,
  };
}

export async function deleteEdgeFromDb(userId: string, id: string) {
  await db
    .delete(canvasEdges)
    .where(and(eq(canvasEdges.id, id), eq(canvasEdges.userId, userId)));
}

export async function getUserCanvasSessionsFromDb(userId: string) {
  const sessions = await db.query.canvasSessions.findMany({
    where: eq(canvasSessions.userId, userId),
    orderBy: [desc(canvasSessions.updatedAt)],
  });

  return sessions.map((s) => ({
    id: s.id,
    name: s.name,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  }));
}

export async function deleteCanvasSessionFromDb(userId: string, id: string) {
  await db
    .delete(canvasSessions)
    .where(and(eq(canvasSessions.id, id), eq(canvasSessions.userId, userId)));
}

export async function createCanvasSessionInDb(userId: string, name: string = "Untitled Canvas") {
  const [newSession] = await db
    .insert(canvasSessions)
    .values({
      userId,
      name,
    })
    .returning();
  return {
    id: newSession.id,
    name: newSession.name,
    created_at: newSession.createdAt.toISOString(),
    updated_at: newSession.updatedAt.toISOString(),
  };
}

export async function updateCanvasSessionNameInDb(userId: string, id: string, name: string) {
  const [updated] = await db
    .update(canvasSessions)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(canvasSessions.id, id), eq(canvasSessions.userId, userId)))
    .returning();
  if (!updated) return null;
  return {
    id: updated.id,
    name: updated.name,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  };
}

export async function clearCanvasInDb(userId: string, targetCanvasId?: string) {
  let canvasId = targetCanvasId;
  if (!canvasId) {
    const latest = await db.query.canvasSessions.findFirst({
      where: eq(canvasSessions.userId, userId),
      orderBy: [desc(canvasSessions.createdAt)],
    });
    if (!latest) throw new Error("No canvas session found");
    canvasId = latest.id;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(canvasEdges)
      .where(and(eq(canvasEdges.canvasId, canvasId!), eq(canvasEdges.userId, userId)));
    await tx
      .delete(canvasBlocks)
      .where(and(eq(canvasBlocks.canvasId, canvasId!), eq(canvasBlocks.userId, userId)));
  });
}

export async function reorderCanvasBlocksInDb(
  userId: string,
  blocks: { id: string; order: number }[],
  canvasId?: string
) {
  if (!blocks || blocks.length === 0) return;

  await db.transaction(async (tx) => {
    for (const block of blocks) {
      await tx
        .update(canvasBlocks)
        .set({ orderIndex: block.order, updatedAt: new Date() })
        .where(and(eq(canvasBlocks.id, block.id), eq(canvasBlocks.userId, userId)));
    }
  });
}

export async function updateCanvasChatHistoryInDb(
  userId: string,
  chatHistory: any[],
  canvasId?: string
) {
  try {
    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const latest = await db.query.canvasSessions.findFirst({
        where: eq(canvasSessions.userId, userId),
        orderBy: [desc(canvasSessions.createdAt)],
      });
      if (latest) {
        targetCanvasId = latest.id;
      }
    }

    if (targetCanvasId && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        await db
          .insert(chatMessages)
          .values({
            id: msg.id || crypto.randomUUID(),
            userId,
            canvasId: targetCanvasId,
            role: msg.role,
            content: msg.content || "",
            toolInvocations: msg.toolInvocations || null,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          })
          .onConflictDoUpdate({
            target: chatMessages.id,
            set: {
              content: msg.content || "",
              toolInvocations: msg.toolInvocations || null,
            },
          });
      }
    }
  } catch (err) {
    console.warn("[updateCanvasChatHistoryInDb] Error upserting chat history:", err);
  }
}
