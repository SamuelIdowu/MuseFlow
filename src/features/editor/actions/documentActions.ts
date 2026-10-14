"use server";

import { auth } from "@clerk/nextjs/server";
import { getDbUserId } from "@/db/queries/users";

import {
  saveDocumentInDb,
  getDocumentFromDb,
  getUserDocumentsFromDb,
  deleteDocumentFromDb,
} from "@/db/queries/documents";

export interface DocumentData {
  id?: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content_json?: any;
  content_html: string;
  word_count?: number;
  updated_at?: string;
}

export async function saveDocumentAction(doc: DocumentData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized: Please sign in to save your document");
  }

  const userId = await getDbUserId(clerkUserId);
  if (!userId) {
    throw new Error("User account not synchronized");
  }

  const saved = await saveDocumentInDb(userId, doc);
  if (!saved) {
    throw new Error("Failed to save document");
  }
  return saved;
}

export async function getDocumentAction(documentId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null;
  }

  const userId = await getDbUserId(clerkUserId);
  if (!userId) {
    return null;
  }

  return await getDocumentFromDb(userId, documentId);
}

export async function getUserDocumentsAction() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return [];
  }

  const userId = await getDbUserId(clerkUserId);
  if (!userId) {
    return [];
  }

  return await getUserDocumentsFromDb(userId);
}

export async function deleteDocumentAction(documentId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const userId = await getDbUserId(clerkUserId);
  if (!userId) {
    throw new Error("User account not synchronized");
  }

  return await deleteDocumentFromDb(userId, documentId);
}
