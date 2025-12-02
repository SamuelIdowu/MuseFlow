import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { unstable_cache, revalidatePath } from 'next/cache';

/**
 * Creates a Supabase server client for use with service role key
 * This is needed for server actions that require authentication through Clerk
 */
export function createSupabaseServiceClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
    throw new Error('Missing Supabase URL. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL is set.');
  }

  if (!supabaseServiceKey) {
    console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
    throw new Error('Missing Supabase service role key. Please check your .env.local file and ensure SUPABASE_SERVICE_ROLE_KEY is set.');
  }

  // Check for placeholder values that haven't been replaced
  if (supabaseUrl.includes('your_') || supabaseUrl.includes('placeholder')) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL appears to contain a placeholder value');
  }

  if (supabaseServiceKey.includes('your_') || supabaseServiceKey.includes('placeholder')) {
    console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY appears to contain a placeholder value');
  }

  // Log masked URL for debugging
  const maskedUrl = supabaseUrl.replace(/https?:\/\/([^.]+)\./, 'https://***.');
  // console.log('[Supabase] Creating service client with URL:', maskedUrl);

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
}

/**
 * Creates an authenticated Supabase client using Clerk's JWT token
 * This is the proper way to authenticate Supabase requests when using Clerk
 * @param token - Clerk JWT token with "supabase" template
 */
export function createAuthenticatedSupabaseClient(token: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      }
    }
  );
}

/**
 * Internal function to get Supabase user ID from Clerk user ID
 * Cached using unstable_cache
 */
const getCachedSupabaseUserId = unstable_cache(
  async (clerkUserId: string) => {
    // console.log('[getSupabaseUserId] Cache MISS for:', clerkUserId);
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting Supabase user ID:', error);
      }
      return null;
    }

    return data?.id || null;
  },
  ['supabase-user-id'],
  {
    tags: ['supabase-users'],
    revalidate: 3600 // Cache for 1 hour
  }
);

/**
 * Helper function to get Supabase user ID from Clerk user ID
 * This is necessary because RLS policies in Supabase expect the auth.uid() to match user_id FKs
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
  return getCachedSupabaseUserId(clerkUserId);
}

/**
 * Ensures a user exists in Supabase for the given Clerk user
 * Creates the user if they don't exist
 * @param clerkUserId - Clerk user ID
 * @param email - User's email address
 * @returns Supabase user ID or null if operation failed
 */
export async function ensureSupabaseUser(
  clerkUserId: string,
  email: string
): Promise<string | null> {
  // Try to get from cache first
  const cachedId = await getCachedSupabaseUserId(clerkUserId);

  if (cachedId) {
    // console.log('[ensureSupabaseUser] Cache HIT for:', clerkUserId);
    return cachedId;
  }

  console.log('[ensureSupabaseUser] Cache MISS, checking/creating user for:', clerkUserId);

  const supabase = createSupabaseServiceClient();

  // Double check DB in case cache was just stale null (though unstable_cache handles this mostly)
  // But since we are about to write, we should be sure.
  // Actually, getCachedSupabaseUserId already checked DB. If it returned null, user likely doesn't exist.

  // User doesn't exist, create them
  console.log('[ensureSupabaseUser] User not found in cache/DB, creating new user...');
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkUserId,
      email: email,
    })
    .select('id')
    .single();

  if (insertError) {
    // If duplicate key error, user was created by another concurrent request
    // Retry the SELECT to get their ID
    if (insertError.code === '23505') {
      console.log('[ensureSupabaseUser] Duplicate key error (race condition), retrying SELECT...');

      const { data: retryUser, error: retryError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (retryUser && !retryError) {
        console.log('[ensureSupabaseUser] Found user on retry with ID:', retryUser.id);
        // Invalidate cache so next read finds it
        revalidatePath('/', 'layout');
        return retryUser.id;
      }

      console.error('[ensureSupabaseUser] Retry failed:', retryError);
      return null;
    }

    // Other errors
    console.error('[ensureSupabaseUser] Error creating Supabase user:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    return null;
  }

  console.log('[ensureSupabaseUser] User created successfully with ID:', newUser?.id);
  // Invalidate cache so next read finds the new user
  revalidatePath('/', 'layout');

  return newUser?.id || null;
}
