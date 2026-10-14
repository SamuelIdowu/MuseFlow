import { db } from "../index";
import { ideaKernels } from "../schema/ideas";
import { eq, and, desc } from "drizzle-orm";

export async function getRecentIdeasFromDb(userId: string, limit: number = 3) {
  const ideas = await db.query.ideaKernels.findMany({
    where: eq(ideaKernels.userId, userId),
    orderBy: [desc(ideaKernels.createdAt)],
    limit,
  });

  return ideas.flatMap((idea) => {
    const kernelsList = Array.isArray(idea.kernels) ? idea.kernels : [];
    return kernelsList.map((kernel: any, index: number) => ({
      id: `${idea.id}-${index}`,
      title: typeof kernel === "string" ? kernel : kernel.title || "Untitled Idea",
      createdAt: idea.createdAt.toISOString(),
      inputData: idea.inputData,
      inputType: idea.inputType,
    }));
  }).slice(0, limit);
}

export async function getRecentChatsFromDb(userId: string, limit: number = 20) {
  const chats = await db.query.ideaKernels.findMany({
    where: eq(ideaKernels.userId, userId),
    orderBy: [desc(ideaKernels.createdAt)],
    limit,
  });

  return chats.map((chat) => ({
    id: chat.id,
    title: chat.inputData.length > 40 ? chat.inputData.substring(0, 40) + "..." : chat.inputData,
    createdAt: chat.createdAt.toISOString(),
  }));
}

export async function getChatByIdFromDb(userId: string, id: string) {
  const chat = await db.query.ideaKernels.findFirst({
    where: and(eq(ideaKernels.id, id), eq(ideaKernels.userId, userId)),
  });

  if (!chat) return null;

  const messages: any[] = [];
  messages.push({
    id: "msg-0",
    role: "user",
    content: chat.inputData,
    timestamp: chat.createdAt,
  });

  const kernels = chat.kernels as any[];
  if (Array.isArray(kernels)) {
    kernels.forEach((k: any, index: number) => {
      if (typeof k === "string") {
        messages.push({
          id: `msg-ai-${index}`,
          role: "assistant",
          content: k,
          type: "text",
          timestamp: chat.createdAt,
        });
      } else if (k.role && k.content) {
        messages.push({
          id: k.id || `msg-${index + 1}`,
          role: k.role,
          content: k.content,
          type: k.type || "text",
          timestamp: k.timestamp ? new Date(k.timestamp) : chat.createdAt,
        });
      }
    });
  }

  return {
    id: chat.id,
    messages,
  };
}

export async function getUserIdeasFromDb(userId: string) {
  const ideas = await db.query.ideaKernels.findMany({
    where: eq(ideaKernels.userId, userId),
    orderBy: [desc(ideaKernels.createdAt)],
  });

  return ideas.map((idea) => ({
    id: idea.id,
    user_id: idea.userId,
    input_data: idea.inputData,
    input_type: idea.inputType,
    kernels: idea.kernels,
    created_at: idea.createdAt.toISOString(),
  }));
}

export async function saveToIdeasInDb(userId: string, content: string, title?: string) {
  const [created] = await db
    .insert(ideaKernels)
    .values({
      userId,
      inputData: content,
      inputType: "text",
      kernels: [title || "Saved from Canvas"],
    })
    .returning();

  return {
    id: created.id,
    user_id: created.userId,
    input_data: created.inputData,
    input_type: created.inputType,
    kernels: created.kernels,
    created_at: created.createdAt.toISOString(),
  };
}

export async function deleteIdeaFromDb(userId: string, id: string) {
  await db
    .delete(ideaKernels)
    .where(and(eq(ideaKernels.id, id), eq(ideaKernels.userId, userId)));
  return { success: true };
}

export async function deleteAllChatsFromDb(userId: string) {
  await db.delete(ideaKernels).where(eq(ideaKernels.userId, userId));
  return { success: true };
}
