'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export async function getDashboardStats() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Get idea count
  const { count: ideasCount, error: ideasError } = await supabase
    .from('idea_kernels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId as never);

  if (ideasError) {
    console.error('Error fetching ideas count:', ideasError);
    throw new Error('Could not fetch ideas count');
  }

  // Get canvas sessions count (as content pieces)
  const { count: contentCount, error: contentError } = await supabase
    .from('canvas_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId as never);

  if (contentError) {
    console.error('Error fetching content count:', contentError);
    throw new Error('Could not fetch content count');
  }

  // Get scheduled posts count
  const { count: scheduledCount, error: scheduledError } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId as never);

  if (scheduledError) {
    console.error('Error fetching scheduled posts count:', scheduledError);
    throw new Error('Could not fetch scheduled posts count');
  }

  // Get profile count (should be 1 per user, but counting for consistency)
  const { count: profileCount, error: profileError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId as never);

  if (profileError) {
    console.error('Error fetching profile count:', profileError);
    throw new Error('Could not fetch profile count');
  }

  return {
    ideasCount: ideasCount || 0,
    contentCount: contentCount || 0,
    scheduledCount: scheduledCount || 0,
    profileCount: profileCount || 0,
  };
}

export async function getRecentIdeas(limit = 3) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Get recent idea kernels
  const { data: ideas, error } = await supabase
    .from('idea_kernels')
    .select('*')
    .eq('user_id', userId as never)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !ideas) {
    console.error('Error fetching recent ideas:', error);
    throw new Error('Could not fetch recent ideas');
  }

  // Transform the data to have a flat list of ideas with their metadata
  type IdeaKernel = Database['public']['Tables']['idea_kernels']['Row'];
  const recentIdeas = (ideas as IdeaKernel[]).flatMap(idea => 
    (idea.kernels as string[]).map((kernel: string) => ({
      id: idea.id,
      title: kernel,
      createdAt: idea.created_at,
      inputData: idea.input_data,
      inputType: idea.input_type,
    }))
  ).slice(0, limit); // Limit again after flattening

  return recentIdeas;
}