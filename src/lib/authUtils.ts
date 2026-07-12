import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from './supabaseServerClient';

/**
 * A resilient way to get the Supabase user ID from the current Clerk session.
 */
export async function getAuthenticatedSupabaseUserId(): Promise<string> {
  const authData = await auth();
  const { userId } = authData;

  if (!userId) {
    console.error('[getAuthenticatedSupabaseUserId] No userId found in auth() object.');
    
    // Provide a helpful error that points to common causes
    throw new Error(
      'User not authenticated on server. Possible causes:\n' +
      '1. CLERK_SECRET_KEY is missing or invalid in .env.local\n' +
      '2. Browser/Server session desync (Try signing out and back in)\n' +
      '3. Domain mismatch (localhost vs 127.0.0.1)'
    );
  }

  // 1. Try quick lookup by Clerk ID
  const existingId = await ensureSupabaseUser(userId);
  if (existingId) return existingId;

  // 2. Fallback to currentUser() for first-time sync
  try {
    const user = await currentUser();
    if (!user) throw new Error('Clerk user not found');
    
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error('User has no email address');
    
    const syncedId = await ensureSupabaseUser(userId, email);
    if (!syncedId) throw new Error('Failed to synchronize user');
    
    return syncedId;
  } catch (error) {
    console.error('[getAuthenticatedSupabaseUserId] Sync error:', error);
    throw new Error('Authentication synchronization failed. Please check your connection.');
  }
}
