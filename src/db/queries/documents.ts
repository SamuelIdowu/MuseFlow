import { db } from "../index";
import { documents } from "../schema/documents";
import { eq, and, desc } from "drizzle-orm";
import type { Json } from "../../lib/database.types";

export interface DocumentDataInput {
  id?: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content_json?: Json;
  content_html: string;
  word_count?: number;
  updated_at?: string;
}

export async function saveDocumentInDb(userId: string, doc: DocumentDataInput) {
  if (doc.id) {
    const [updated] = await db
      .update(documents)
      .set({
        title: doc.title,
        subtitle: doc.subtitle || null,
        excerpt: doc.excerpt || null,
        contentJson: doc.content_json || null,
        contentHtml: doc.content_html,
        wordCount: doc.word_count || 0,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, doc.id), eq(documents.userId, userId)))
      .returning();

    if (!updated) return null;

    return {
      id: updated.id,
      user_id: updated.userId,
      title: updated.title,
      subtitle: updated.subtitle,
      excerpt: updated.excerpt,
      content_json: updated.contentJson,
      content_html: updated.contentHtml,
      word_count: updated.wordCount,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };
  } else {
    const [created] = await db
      .insert(documents)
      .values({
        userId,
        title: doc.title || "Untitled Document",
        subtitle: doc.subtitle || null,
        excerpt: doc.excerpt || null,
        contentJson: doc.content_json || null,
        contentHtml: doc.content_html,
        wordCount: doc.word_count || 0,
      })
      .returning();

    return {
      id: created.id,
      user_id: created.userId,
      title: created.title,
      subtitle: created.subtitle,
      excerpt: created.excerpt,
      content_json: created.contentJson,
      content_html: created.contentHtml,
      word_count: created.wordCount,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    };
  }
}

export async function getDocumentFromDb(userId: string, documentId: string) {
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });

  if (!doc) return null;

  return {
    id: doc.id,
    user_id: doc.userId,
    title: doc.title,
    subtitle: doc.subtitle,
    excerpt: doc.excerpt,
    content_json: doc.contentJson,
    content_html: doc.contentHtml,
    word_count: doc.wordCount,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };
}

export async function getUserDocumentsFromDb(userId: string) {
  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, userId),
    orderBy: [desc(documents.updatedAt)],
  });

  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    excerpt: d.excerpt,
    word_count: d.wordCount,
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
  }));
}

export async function deleteDocumentFromDb(userId: string, documentId: string) {
  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
  return { success: true };
}
