/* eslint-disable @typescript-eslint/no-explicit-any */
import { ensureDbUser, getDbUserId } from '@/db/queries/users';

/**
 * @deprecated Supabase has been removed in favor of Neon PostgreSQL + Drizzle ORM.
 */
export function createSupabaseServiceClient(): any {
  console.warn('[DEPRECATED] createSupabaseServiceClient called after Supabase cutoff');
  return null;
}

/**
 * @deprecated Supabase has been removed in favor of Neon PostgreSQL + Drizzle ORM.
 */
export function createAuthenticatedSupabaseClient(_token?: string): any {
  console.warn('[DEPRECATED] createAuthenticatedSupabaseClient called after Supabase cutoff');
  return null;
}

/**
 * @deprecated Supabase has been removed in favor of Neon PostgreSQL + Drizzle ORM.
 */
export async function createClerkSupabaseClient(): Promise<any> {
  console.warn('[DEPRECATED] createClerkSupabaseClient called after Supabase cutoff');
  return null;
}

/**
 * @deprecated Forwarded to Neon getDbUserId.
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
  return await getDbUserId(clerkUserId);
}

/**
 * @deprecated Forwarded to Neon ensureDbUser.
 */
export async function ensureSupabaseUser(
  clerkUserId: string,
  email?: string
): Promise<string | null> {
  return await ensureDbUser(clerkUserId, email);
}
