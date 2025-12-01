import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Creates a Supabase server client for use with service role key
 * This is needed for server actions that require authentication through Clerk
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
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
    console.error('Error getting Supabase user ID:', error);
    return null;
  }

  return data?.id || null;
}
