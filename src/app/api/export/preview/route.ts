/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { formatForChannel } from '@/lib/geminiClient';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_blocks, channel } = await request.json();

    // Validate input
    if (!content_blocks || !channel) {
      return NextResponse.json({ error: 'Content blocks and channel are required' }, { status: 400 });
    }

    // Get the combined content
    const content = content_blocks.map((block: any) => block.content).join(' ');

    // Use Gemini to format content for the specific channel
    const formattedContent = await formatForChannel(content, channel);

    return NextResponse.json({ 
      channel,
      preview: formattedContent,
      original_blocks: content_blocks
    });
  } catch (error) {
    console.error('Error generating export preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}