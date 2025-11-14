import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { expandContentBlock } from '@/lib/geminiClient';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { block_content, block_type } = await request.json();

    // Validate input
    if (!block_content?.trim()) {
      return NextResponse.json({ error: 'Block content is required' }, { status: 400 });
    }

    // Call the Gemini API to expand the block content
    const expandedContent = await expandContentBlock(block_content, block_type);

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