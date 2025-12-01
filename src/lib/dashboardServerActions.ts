'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Database } from './database.types';
import { createSupabaseServiceClient, ensureSupabaseUser } from './supabaseServerClient';
import { Profile } from '@/types/profile';

export async function getDashboardStats() {
  // Get Clerk authentication
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    console.error('Dashboard stats - No Clerk user found');
    throw new Error('User not authenticated');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    console.error('Dashboard stats - No email found for user');
    throw new Error('User has no email address');
  }

  // Ensure user exists in Supabase and get their UUID
  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) {
    throw new Error('Failed to ensure Supabase user exists');
  }

  // Create Supabase service client (bypasses RLS to avoid UUID/String type mismatch in policies)
  const supabase = createSupabaseServiceClient();

  let ideasCount = 0;
  let contentCount = 0;
  let scheduledCount = 0;
  let profileCount = 0;

  try {
    // Get idea count
    console.log('[getDashboardStats] Fetching ideas count for user:', supabaseUserId);
    const { count: ideasCountResult, error: ideasError } = await supabase
      .from('idea_kernels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (ideasError) {
      console.error('[getDashboardStats] Error fetching ideas count:', {
        message: ideasError.message,
        details: ideasError.details,
        hint: ideasError.hint,
        code: ideasError.code,
      });
      throw new Error('Could not fetch ideas count');
    }
    ideasCount = ideasCountResult || 0;
    console.log('[getDashboardStats] Ideas count:', ideasCount);

    // Get canvas sessions count (as content pieces)
    const { count: contentCountResult, error: contentError } = await supabase
      .from('canvas_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (contentError) {
      console.error('Error fetching content count:', contentError);
      throw new Error('Could not fetch content count');
    }
    contentCount = contentCountResult || 0;

    // Get scheduled posts count
    const { count: scheduledCountResult, error: scheduledError } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (scheduledError) {
      console.error('Error fetching scheduled posts count:', scheduledError);
      throw new Error('Could not fetch scheduled posts count');
    }
    scheduledCount = scheduledCountResult || 0;

    // Get profile count (should be 1 per user, but counting for consistency)
    const { count: profileCountResult, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (profileError) {
      console.error('Error fetching profile count:', profileError);
      throw new Error('Could not fetch profile count');
    }
    profileCount = profileCountResult || 0;
  } catch (error) {
    console.error('[getDashboardStats] Database error:', error);

    // Check if this is a fetch error
    if (error instanceof Error) {
      console.error('[getDashboardStats] Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      });

      // Detect specific fetch-related errors
      if (error.message.includes('fetch failed')) {
        console.error('[getDashboardStats] FETCH FAILURE DETECTED - Possible causes:');
        console.error('  1. Supabase instance may be paused (common in free tier after inactivity)');
        console.error('  2. Network connectivity issues');
        console.error('  3. Invalid Supabase URL in environment variables');
        console.error('  4. Firewall or proxy blocking the connection');
        console.error('  → Check your Supabase dashboard to ensure the project is active');
        console.error('  → Verify NEXT_PUBLIC_SUPABASE_URL in .env.local is correct');
      }
    }

    throw new Error('Could not fetch dashboard statistics');
  }

  return {
    ideasCount,
    contentCount,
    scheduledCount,
    profileCount,
  };
}

export async function getRecentIdeas(limit = 3) {
  // Get Clerk authentication
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    console.error('Recent ideas - No Clerk user found');
    throw new Error('User not authenticated');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    console.error('Recent ideas - No email found for user');
    throw new Error('User has no email address');
  }

  // Ensure user exists in Supabase and get their UUID
  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) {
    throw new Error('Failed to ensure Supabase user exists');
  }

  // Create Supabase service client (bypasses RLS to avoid UUID/String type mismatch in policies)
  const supabase = createSupabaseServiceClient();

  let ideas = [];

  try {
    // Get recent idea kernels
    const { data: ideasData, error } = await supabase
      .from('idea_kernels')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !ideasData) {
      console.error('Error fetching recent ideas:', error);
      throw new Error('Could not fetch recent ideas');
    }

    ideas = ideasData;
  } catch (error) {
    console.error('Database error in getRecentIdeas:', error);
    throw new Error('Could not fetch recent ideas');
  }

  // Transform the data to have a flat list of ideas with their metadata
  type IdeaKernel = Database['public']['Tables']['idea_kernels']['Row'];
  const recentIdeas = (ideas as IdeaKernel[]).flatMap(idea =>
    (idea.kernels as string[]).map((kernel: string, index: number) => ({
      id: `${idea.id}-${index}`,
      title: kernel,
      createdAt: idea.created_at,
      inputData: idea.input_data,
      inputType: idea.input_type,
    }))
  ).slice(0, limit); // Limit again after flattening

  return recentIdeas;
}

export async function getCanvasDataAction() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('User not authenticated');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('User has no email address');
  }

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) {
    throw new Error('Failed to ensure Supabase user exists');
  }

  const supabase = createSupabaseServiceClient();

  // Get or create canvas session
  let canvasSession;
  const { data: existingSessions, error: sessionError } = await supabase
    .from("canvas_sessions")
    .select("*")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (sessionError) {
    console.error("Error fetching canvas sessions:", sessionError);
    throw new Error('Failed to fetch canvas sessions');
  }

  if (existingSessions && existingSessions.length > 0) {
    canvasSession = existingSessions[0];
  } else {
    // Create a new canvas session
    const { data: newSession, error: createError } = await supabase
      .from("canvas_sessions")
      .insert([{
        user_id: supabaseUserId,
        name: "New Canvas",
      }])
      .select()
      .single();

    if (createError) {
      console.error("Error creating canvas session:", createError);
      throw new Error('Failed to create canvas session');
    }
    canvasSession = newSession;
  }

  // Fetch canvas blocks
  const { data: blocksData, error: blocksError } = await supabase
    .from("canvas_blocks")
    .select("*")
    .eq("canvas_id", canvasSession.id)
    .order("order_index", { ascending: true });

  if (blocksError) {
    console.error("Error fetching canvas blocks:", blocksError);
    throw new Error('Failed to fetch canvas blocks');
  }

  return blocksData.map((block) => ({
    id: block.id,
    type: block.type || "paragraph",
    content: block.content,
    order: block.order_index,
  }));
}

export async function addCanvasBlockAction(block: { type: string; content: string; order: number }) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('User not authenticated');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  // Get canvas session
  const { data: sessions } = await supabase
    .from("canvas_sessions")
    .select("id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
  const canvasId = sessions[0].id;

  const { data, error } = await supabase
    .from("canvas_blocks")
    .insert([{
      canvas_id: canvasId,
      user_id: supabaseUserId,
      type: block.type,
      content: block.content,
      order_index: block.order,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding canvas block:', error);
    throw new Error('Failed to add block');
  }
  return data;
}

export async function updateCanvasBlockAction(id: string, updates: { content?: string; type?: string }) {
  const { userId } = await auth();
  const user = await currentUser(); // Need user to ensure ownership via RLS-like check or just user_id

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("canvas_blocks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", supabaseUserId); // Ensure ownership

  if (error) {
    console.error('Error updating canvas block:', error);
    throw new Error('Failed to update block');
  }
}

export async function deleteCanvasBlockAction(id: string) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("canvas_blocks")
    .delete()
    .eq("id", id)
    .eq("user_id", supabaseUserId);

  if (error) {
    console.error('Error deleting canvas block:', error);
    throw new Error('Failed to delete block');
  }
}

export async function reorderCanvasBlocksAction(blocks: { id: string; order: number }[]) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  // First pass: Set to temporary negative values to avoid unique constraint violations
  for (const block of blocks) {
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ order_index: -1 * (block.order + 1) })
      .eq("id", block.id)
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error(`Error reordering (temp phase) canvas block ${block.id}:`, error);
      throw new Error(`Failed to update order for block ${block.id}`);
    }
  }

  // Second pass: Set to final values
  for (const block of blocks) {
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ order_index: block.order })
      .eq("id", block.id)
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error(`Error reordering (final phase) canvas block ${block.id}:`, error);
      throw new Error(`Failed to update order for block ${block.id}`);
    }
  }
}

export async function getUserIdeasAction() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('User not authenticated');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user ideas:', error);
    throw new Error('Failed to fetch ideas');
  }

  return data;
}

export async function getActiveProfile(): Promise<Profile | null> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get user info from Clerk to get email
  // We need email to ensure user exists in Supabase
  // Using a try-catch to handle potential API errors gracefully
  let email: string | undefined;
  try {
    const user = await currentUser();
    email = user?.emailAddresses[0]?.emailAddress;
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    // If we can't get the user, we can't proceed
    throw new Error('Failed to fetch user information from Clerk');
  }

  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUserId)
    .eq('is_active', true)
    .single();

  if (error) {
    // If no active profile found, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching active profile:', error);
    throw new Error('Failed to fetch active profile');
  }

  return data as Profile;
}

export async function clearCanvasAction() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  // Get canvas session
  const { data: sessions } = await supabase
    .from("canvas_sessions")
    .select("id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) throw new Error('No canvas session found');
  const canvasId = sessions[0].id;

  const { error } = await supabase
    .from("canvas_blocks")
    .delete()
    .eq("canvas_id", canvasId)
    .eq("user_id", supabaseUserId);

  if (error) {
    console.error('Error clearing canvas:', error);
    throw new Error('Failed to clear canvas');
  }
}

export async function saveToIdeasAction(content: string, title?: string) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idea_kernels')
    .insert([{
      user_id: supabaseUserId,
      input_data: content,
      input_type: 'text',
      kernels: [title || 'Saved from Canvas'],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving to ideas:', error);
    throw new Error('Failed to save to ideas');
  }

  return data;
}

export async function deleteIdeaAction(id: string) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error('User not authenticated');

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('User has no email address');

  const supabaseUserId = await ensureSupabaseUser(userId, email);
  if (!supabaseUserId) throw new Error('Failed to ensure Supabase user exists');

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from('idea_kernels')
    .delete()
    .eq('id', id)
    .eq('user_id', supabaseUserId);

  if (error) {
    console.error('Error deleting idea:', error);
    throw new Error('Failed to delete idea');
  }
}