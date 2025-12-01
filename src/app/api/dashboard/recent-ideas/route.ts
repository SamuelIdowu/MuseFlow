import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

async function getRecentIdeasAPI(limit = 3) {
  const supabase = await createSupabaseServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const userId = user.id;

  // Get recent idea kernels
  const { data: ideas, error } = await supabase
    .from('idea_kernels')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent ideas:', error);
    throw new Error('Could not fetch recent ideas');
  }

  // Transform the data to have a flat list of ideas with their metadata
  const recentIdeas = ideas.flatMap(idea =>
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

export async function GET(request: Request) {
  try {
    // Get the user
    const supabase = await createSupabaseServiceClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    // Call the recent ideas function
    const recentIdeas = await getRecentIdeasAPI(limit);

    return NextResponse.json(recentIdeas);
  } catch (error: any) {
    console.error('Error fetching recent ideas:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}