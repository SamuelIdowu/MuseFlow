import { NextResponse } from 'next/server';
import { ideasService } from '@/lib/supabaseService';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

export async function GET(_request: Request) {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch idea kernels from the database
    const ideaKernels = await ideasService.getUserIdeas(session.user.id);

    return NextResponse.json(ideaKernels);
  } catch (error) {
    console.error('Error fetching idea kernels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}