import { NextResponse } from 'next/server';
import { ideasService } from '@/lib/supabaseService';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function GET(_request: Request) {
  const supabase = await createSupabaseServiceClient();
  
  try {
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch idea kernels from the database
    const ideaKernels = await ideasService.getUserIdeas(user.id);

    return NextResponse.json(ideaKernels);
  } catch (error) {
    console.error('Error fetching idea kernels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}