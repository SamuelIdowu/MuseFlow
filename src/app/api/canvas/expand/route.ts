import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { expandContentBlock } from '@/lib/geminiClient';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });

  try {
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Add debugging logs
    console.log('Canvas expand - User retrieval result:', {
      hasUser: !!user,
      userId: user?.id,
      userError,
      cookiesAvailable: cookieStore.getAll().length > 0
    });

    if (!user || userError) {
      console.error('Canvas expand - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { block_content, block_type } = await request.json();

    // Validate input
    if (!block_content?.trim()) {
      return NextResponse.json({ error: 'Block content is required' }, { status: 400 });
    }

    console.log('Canvas expand - Expanding block for user:', { userId: user.id, block_type, contentLength: block_content.length });

    // Call the Gemini API to expand the block content
    const expandedContent = await expandContentBlock(block_content, block_type);

    console.log('Canvas expand - Successfully expanded block for user:', user.id);
    return NextResponse.json({
      original_content: block_content,
      expanded_content: expandedContent,
      block_type
    });
  } catch (error) {
    console.error('Error expanding block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}