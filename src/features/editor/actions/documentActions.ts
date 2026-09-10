"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServiceClient, getSupabaseUserId } from "@/lib/supabaseServerClient";

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

  const supabaseUserId = await getSupabaseUserId(clerkUserId);
  if (!supabaseUserId) {
    throw new Error("User account not synchronized");
  }

  const supabase = createSupabaseServiceClient();

  if (doc.id) {
    // Update existing document
    const { data, error } = await supabase
      .from("documents")
      .update({
        title: doc.title,
        subtitle: doc.subtitle || null,
        excerpt: doc.excerpt || null,
        content_json: doc.content_json || null,
        content_html: doc.content_html,
        word_count: doc.word_count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", doc.id)
      .eq("user_id", supabaseUserId)
      .select()
      .single();

    if (error) {
      console.error("[saveDocumentAction Update Error]:", error);
      throw new Error(error.message || "Failed to save document");
    }

    return data;
  } else {
    // Create new document
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: supabaseUserId,
        title: doc.title || "Untitled Document",
        subtitle: doc.subtitle || null,
        excerpt: doc.excerpt || null,
        content_json: doc.content_json || null,
        content_html: doc.content_html,
        word_count: doc.word_count || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[saveDocumentAction Insert Error]:", error);
      throw new Error(error.message || "Failed to create document");
    }

    return data;
  }
}

export async function getDocumentAction(documentId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null;
  }

  const supabaseUserId = await getSupabaseUserId(clerkUserId);
  if (!supabaseUserId) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", supabaseUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getUserDocumentsAction() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return [];
  }

  const supabaseUserId = await getSupabaseUserId(clerkUserId);
  if (!supabaseUserId) {
    return [];
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, subtitle, excerpt, word_count, updated_at, created_at")
    .eq("user_id", supabaseUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getUserDocumentsAction Error]:", error);
    return [];
  }

  return data || [];
}

export async function deleteDocumentAction(documentId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const supabaseUserId = await getSupabaseUserId(clerkUserId);
  if (!supabaseUserId) {
    throw new Error("User account not synchronized");
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", supabaseUserId);

  if (error) {
    console.error("[deleteDocumentAction Error]:", error);
    throw new Error(error.message || "Failed to delete document");
  }

  return { success: true };
}
