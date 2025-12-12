import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { cache } from 'react';

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
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // @ts-ignore - duplex is not in the RequestInit type for some versions but required for node fetch
            duplex: 'half',
          });
        }
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
 * Helper function to get Supabase user ID from Clerk user ID
 * This is necessary because RLS policies in Supabase expect the auth.uid() to match user_id FKs
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
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
}

/**
 * Ensures a user exists in Supabase for the given Clerk user
 * Creates the user if they don't exist
 * @param clerkUserId - Clerk user ID
 * @param email - User's email address
 * @returns Supabase user ID or null if operation failed
 */
export const ensureSupabaseUser = cache(async (
  clerkUserId: string,
  email: string
): Promise<string | null> => {
  // Try to get existing user
  const existingId = await getSupabaseUserId(clerkUserId);

  if (existingId) {
    return existingId;
  }

  console.log('[ensureSupabaseUser] User not found, creating new user for:', clerkUserId);

  const supabase = createSupabaseServiceClient();

  // User doesn't exist, create them
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
    // OR the email already exists but with a different clerk_id
    if (insertError.code === '23505') {
      console.log('[ensureSupabaseUser] Duplicate key error, checking for existing user...');

      // 1. Check if it was a race condition on clerk_id
      const { data: retryUser, error: retryError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (retryUser && !retryError) {
        console.log('[ensureSupabaseUser] Found user by clerk_id after race condition');
        return retryUser.id;
      }

      // 2. Check if it was a collision on email (e.g. old account with same email)
      console.log('[ensureSupabaseUser] Checking for email collision:', email);
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (emailUser && !emailError) {
        console.log('[ensureSupabaseUser] Found user by email, updating clerk_id...');

        // Update the clerk_id for this user to match the current one
        const { error: updateError } = await supabase
          .from('users')
          .update({ clerk_id: clerkUserId })
          .eq('id', emailUser.id);

        if (updateError) {
          console.error('[ensureSupabaseUser] Failed to update clerk_id for existing email user:', updateError);
          // We can't return the ID if we failed to claim the user, as it might lead to security issues
          // or data inconsistency. But usually this should work.
          // If we fail here, we should probably throw or return null.
          return null;
        }

        console.log('[ensureSupabaseUser] Successfully updated clerk_id for user:', emailUser.id);
        return emailUser.id;
      }

      console.error('[ensureSupabaseUser] Duplicate key error but could not find user by clerk_id or email');
      return null;
    }

    // Other errors
    console.error('[ensureSupabaseUser] Error creating Supabase user:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      clerkUserId,
      email
    });
    return null;
  }

  console.log('[ensureSupabaseUser] User created successfully with ID:', newUser?.id);

  return newUser?.id || null;
});
